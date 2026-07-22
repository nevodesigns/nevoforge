"""NevoForge CAD design audit report generator.

Usage: python3 audit_report.py <model.step> [-o output/audit.md]

Parses a STEP assembly, classifies parts into fasteners and bearings,
groups them by size, and writes a structured audit markdown that feeds
the docs-forge report pipeline directly.
"""

from __future__ import annotations

import argparse
import datetime
import os
import re
import sys

from step_parser import parse_step, StepFileTooLarge

FASTENER_RE = re.compile(
    r"screw|bolt|nut|washer|standoff|insert|rivet|shcs|fhcs|bhcs|"
    r"din\s?912|iso\s?4762|iso\s?7380|threaded",
    re.I,
)
METRIC_SIZE_RE = re.compile(r"\bM(\d+(?:\.\d+)?)(?:\s*[xX]\s*(\d+(?:\.\d+)?))?\b")

BEARING_RE = re.compile(r"bearing|bushing", re.I)
BEARING_DESIG_RE = re.compile(
    r"\b((?:MR|F)?6[0-9]{2,3}|MR\d{2,3})\s*(ZZ|-2RS|2RS|RS|Z)?\b", re.I
)


def fastener_size(name: str) -> str:
    m = METRIC_SIZE_RE.search(name)
    if not m:
        return "unsized"
    if m.group(2):
        return f"M{m.group(1)} x {m.group(2)}"
    return f"M{m.group(1)}"


def bearing_size(name: str) -> str:
    m = BEARING_DESIG_RE.search(name)
    if m:
        suffix = (m.group(2) or "").upper().lstrip("-")
        return (m.group(1).upper() + suffix) or "unsized"
    return "unsized"


def classify(counts):
    """Split instance counts into fasteners, bearings and other parts."""
    fasteners: dict[str, dict] = {}
    bearings: dict[str, dict] = {}
    other: dict[str, int] = {}

    for name, qty in counts.items():
        if FASTENER_RE.search(name) or (
            METRIC_SIZE_RE.search(name) and not BEARING_RE.search(name)
        ):
            size = fastener_size(name)
            entry = fasteners.setdefault(size, {"qty": 0, "parts": set()})
        elif BEARING_RE.search(name) or BEARING_DESIG_RE.search(name):
            size = bearing_size(name)
            entry = bearings.setdefault(size, {"qty": 0, "parts": set()})
        else:
            other[name] = other.get(name, 0) + qty
            continue
        entry["qty"] += qty
        entry["parts"].add(name)

    return fasteners, bearings, other


def plural(count: int, word: str) -> str:
    return f"{count} {word}" if count == 1 else f"{count} {word}s"


def inventory_table(groups: dict[str, dict]) -> list[str]:
    lines = ["| Size | Quantity | Part names |", "|---|---|---|"]
    for size in sorted(groups):
        entry = groups[size]
        parts = ", ".join(sorted(entry["parts"]))
        lines.append(f"| {size} | {entry['qty']} | {parts} |")
    return lines


def build_report(model, model_name: str) -> str:
    counts = model.instance_counts()
    fasteners, bearings, other = classify(counts)
    today = datetime.date.today().isoformat()

    lines: list[str] = []
    push = lines.append

    push("---")
    push(f"title: CAD Design Audit: {model_name}")
    push("subtitle: Mechanical design review")
    push("author: NevoForge")
    push(f"date: {today}")
    push("---")

    push("# Model Overview")
    push(
        f"Source file **{os.path.basename(model.path)}** contains "
        f"{len(model.entities)} entities, {len(model.products)} distinct products "
        f"and {len(model.solids)} solid bodies. "
        f"Total placed instances: {sum(counts.values())}."
    )
    push("")
    push("| Part | Quantity |")
    push("|---|---|")
    for name in sorted(counts):
        push(f"| {name} | {counts[name]} |")
    push("")
    push(f"![Assembly overview of {model_name}](placeholder)")
    push("")

    push("# Fastener Inventory")
    if fasteners:
        push(
            f"{plural(sum(e['qty'] for e in fasteners.values()), 'fastener')} "
            f"across {plural(len(fasteners), 'size')}."
        )
        push("")
        lines.extend(inventory_table(fasteners))
    else:
        push("No fasteners identified by part name. Verify naming conventions in the source CAD.")
    push("")

    push("# Bearing Inventory")
    if bearings:
        push(
            f"{plural(sum(e['qty'] for e in bearings.values()), 'bearing')} "
            f"across {plural(len(bearings), 'size')}."
        )
        push("")
        lines.extend(inventory_table(bearings))
    else:
        push("No bearings identified by part name. Verify naming conventions in the source CAD.")
    push("")

    if other:
        push("# Other Components")
        push("| Part | Quantity |")
        push("|---|---|")
        for name in sorted(other):
            push(f"| {name} | {other[name]} |")
        push("")

    push("# Load and Design Concerns")
    push("Reviewed item by item during the audit. Each point below is answered in the findings section.")
    push("")
    push("## Fasteners")
    push("Check thread engagement depth against 1.5 x nominal diameter in plastic and 1.0 x in metal. Check edge distance at every tapped or clearance hole. Confirm no fastener carries shear it is not sized for.")
    push("")
    push("## Bearings")
    push("Check seat tolerance and fit class for each bearing bore and shaft. Confirm axial retention on both races. Flag any bearing loaded outside its rated direction.")
    push("")
    push("## Load Paths")
    push("Trace the primary load path from input to ground. Flag cantilevered members, unsupported spans, and single-fastener moment joints.")
    push("")

    push("# Findings and Recommendations")
    push("*Completed by the reviewing engineer for the delivered audit.*")
    push("")
    push("1. Finding: (state the issue, the location, and the severity)")
    push("2. Recommendation: (state the change and why it resolves the finding)")
    push("")

    return "\n".join(lines) + "\n"


def main() -> None:
    ap = argparse.ArgumentParser(description="Generate a CAD audit markdown from a STEP file")
    ap.add_argument("step_file")
    ap.add_argument("-o", "--output", default=None, help="output markdown path")
    args = ap.parse_args()

    try:
        model = parse_step(args.step_file)
    except StepFileTooLarge as exc:
        print(f"error: {exc}", file=sys.stderr)
        raise SystemExit(2)
    except FileNotFoundError as exc:
        print(f"error: {exc}", file=sys.stderr)
        raise SystemExit(2)
    except ValueError as exc:
        print(f"error: {exc}", file=sys.stderr)
        raise SystemExit(2)
    except UnicodeError as exc:
        print(
            f"error: {args.step_file}: not readable as text, this does not look "
            f"like a STEP part 21 file ({exc})",
            file=sys.stderr,
        )
        raise SystemExit(2)

    model_name = os.path.splitext(os.path.basename(args.step_file))[0]
    report = build_report(model, model_name)

    out = args.output or os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "output", f"{model_name}-audit.md"
    )
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(report)
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
