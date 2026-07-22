"""STEP (ISO 10303-21) text parser for NevoForge CAD audits.

Reads the DATA section of a STEP file and extracts the records an audit
needs: products (part names), solid bodies, and assembly occurrences.
Quantities are resolved by following each NEXT_ASSEMBLY_USAGE_OCCURRENCE
through PRODUCT_DEFINITION and PRODUCT_DEFINITION_FORMATION back to the
PRODUCT it instantiates.
"""

from __future__ import annotations

import os
import re
from collections import Counter
from dataclasses import dataclass, field

SOLID_TYPES = {
    "MANIFOLD_SOLID_BREP",
    "BREP_WITH_VOIDS",
    "FACETED_BREP",
}

# Safety limits. Client files are untrusted: a very large STEP file can exhaust
# memory (parsing amplifies file size roughly 25x once entities are held in a
# dict). Refuse oversized input up front with a clear message instead of
# letting the machine run out of RAM.
MAX_FILE_BYTES = 50 * 1024 * 1024   # 50 MB
MAX_ENTITIES = 2_000_000


class StepFileTooLarge(Exception):
    """Raised when an input STEP file exceeds the safety limits."""

_RECORD_RE = re.compile(r"^#(\d+)\s*=\s*([A-Z0-9_]*)\s*\((.*)\)$", re.S)
_REF_RE = re.compile(r"#(\d+)")


@dataclass
class StepEntity:
    eid: int
    etype: str
    raw_args: str

    def strings(self) -> list[str]:
        """Quoted string arguments, in order. STEP escapes ' as ''."""
        out = []
        for m in re.finditer(r"'((?:[^']|'')*)'", self.raw_args):
            out.append(m.group(1).replace("''", "'"))
        return out

    def refs(self) -> list[int]:
        """Entity references (#N), in order."""
        return [int(r) for r in _REF_RE.findall(self.raw_args)]


@dataclass
class StepModel:
    path: str
    entities: dict[int, StepEntity] = field(default_factory=dict)

    def by_type(self, etype: str) -> list[StepEntity]:
        return [e for e in self.entities.values() if e.etype == etype]

    def product_name(self, product: StepEntity) -> str:
        """PRODUCT('id','name','description',...): prefer the name slot."""
        strs = product.strings()
        if len(strs) >= 2 and strs[1].strip():
            return strs[1].strip()
        return strs[0].strip() if strs else f"unnamed #{product.eid}"

    @property
    def products(self) -> list[StepEntity]:
        return self.by_type("PRODUCT")

    @property
    def solids(self) -> list[StepEntity]:
        return [e for e in self.entities.values() if e.etype in SOLID_TYPES]

    def _definition_to_product(self, def_id: int) -> str | None:
        """PRODUCT_DEFINITION -> PRODUCT_DEFINITION_FORMATION -> PRODUCT."""
        definition = self.entities.get(def_id)
        if definition is None or definition.etype != "PRODUCT_DEFINITION":
            return None
        for ref in definition.refs():
            formation = self.entities.get(ref)
            if formation is None:
                continue
            if formation.etype.startswith("PRODUCT_DEFINITION_FORMATION"):
                for pref in formation.refs():
                    product = self.entities.get(pref)
                    if product is not None and product.etype == "PRODUCT":
                        return self.product_name(product)
        return None

    def instance_counts(self) -> Counter[str]:
        """Part name -> number of times it is placed in the assembly.

        Falls back to one instance per product when the file has no
        assembly occurrences (single part exports).
        """
        counts: Counter[str] = Counter()
        occurrences = self.by_type("NEXT_ASSEMBLY_USAGE_OCCURRENCE")
        for occ in occurrences:
            refs = occ.refs()
            # NAUO('id','name','desc',#parent_def,#child_def,...)
            if len(refs) >= 2:
                name = self._definition_to_product(refs[1])
                if name:
                    counts[name] += 1
        if not counts:
            for product in self.products:
                counts[self.product_name(product)] += 1
        return counts


def _iter_records(data_section: str):
    """Yield full records, splitting on ; outside of quoted strings."""
    buf = []
    in_string = False
    for ch in data_section:
        if ch == "'":
            in_string = not in_string
            buf.append(ch)
        elif ch == ";" and not in_string:
            record = "".join(buf).strip()
            if record:
                yield record
            buf = []
        else:
            buf.append(ch)


def parse_step(path: str) -> StepModel:
    if not os.path.isfile(path):
        raise FileNotFoundError(f"{path}: no such file")

    size = os.path.getsize(path)
    if size > MAX_FILE_BYTES:
        raise StepFileTooLarge(
            f"{path}: file is {size / 1048576:.1f} MB, limit is "
            f"{MAX_FILE_BYTES / 1048576:.0f} MB. Ask the client to simplify or "
            f"split the assembly."
        )
    if size == 0:
        raise ValueError(f"{path}: file is empty")

    with open(path, "r", encoding="utf-8", errors="replace") as fh:
        text = fh.read()

    start = text.find("DATA;")
    end = text.find("ENDSEC;", start if start >= 0 else 0)
    if start < 0:
        raise ValueError(f"{path}: no DATA section found, not a STEP part 21 file")
    data = text[start + len("DATA;"):end if end > start else len(text)]

    model = StepModel(path=path)
    for record in _iter_records(data):
        m = _RECORD_RE.match(record.strip())
        if not m:
            continue
        eid, etype, args = int(m.group(1)), m.group(2), m.group(3)
        model.entities[eid] = StepEntity(eid=eid, etype=etype or "COMPLEX", raw_args=args)
        if len(model.entities) > MAX_ENTITIES:
            raise StepFileTooLarge(
                f"{path}: more than {MAX_ENTITIES:,} entities, refusing to "
                f"continue. Ask the client to simplify the assembly."
            )
    return model


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 2:
        print("usage: python3 step_parser.py <model.step>")
        raise SystemExit(1)
    parsed = parse_step(sys.argv[1])
    print(f"file: {parsed.path}")
    print(f"entities: {len(parsed.entities)}")
    print(f"products: {len(parsed.products)}")
    print(f"solids: {len(parsed.solids)}")
    for name, qty in sorted(parsed.instance_counts().items()):
        print(f"  {qty} x {name}")
