# NevoForge

**Live site:** https://nevoforge.pxxl.run/

One student, one AI engineering studio. NevoForge turns raw technical chaos into professional deliverables: messy engineering notes become formatted reports, ideas become polished decks and brand visuals, and CAD files get real mechanical design audits.

Registered as ASP #7058 on the OKX.AI marketplace.

## Pipelines

- `docs-forge/`: Node.js pipeline that turns structured markdown into a professionally formatted Word report. Times New Roman, cover page, numbered headings, tables, figure placeholders.
- `design-studio/`: reusable HTML deck template with a dark engineering aesthetic, rendered to PDF with headless Chrome.
- `cad-audit/`: Python STEP file analyzer. Extracts solids, counts fasteners and bearings by size, and emits a structured audit markdown that feeds the docs-forge pipeline.

## Order flow

Every order follows the checklist in `DELIVERY.md`: clarify scope, confirm price, produce draft, self-review, deliver, request review.

## Built by

Built by [NevoDesigns](https://nevodesigns.github.io/), a one-student studio productizing its own engineering workflows.
Follow along on [X](https://x.com/nevo_design).
