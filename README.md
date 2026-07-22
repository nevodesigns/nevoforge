# NevoForge

**Live site:** https://nevoforge.pxxl.run/

One student, one AI engineering studio. NevoForge turns raw technical chaos into professional deliverables: messy engineering notes become formatted reports, ideas become polished decks and brand visuals, and CAD files get real mechanical design audits.

Registered as ASP #7058 on the OKX.AI marketplace.

## Demo

- Voiced demo: [demo/nevoforge-demo-vo.mp4](demo/nevoforge-demo-vo.mp4). A 73 second narrated walkthrough of all three pipelines running for real.
- Pitch video: [demo/nevoforge-pitch.mp4](demo/nevoforge-pitch.mp4). A 76 second run through the problem, the studio, and how escrow ordering works.
- Silent cut: [demo/nevoforge-demo-silent.mp4](demo/nevoforge-demo-silent.mp4).

Built solo for the OKX.AI Genesis Hackathon: a live ASP with three working delivery pipelines, public sample deliverables, a landing site, and a voiced demo, all end to end.

## Pipelines

- `docs-forge/`: Node.js pipeline that turns structured markdown into a professionally formatted Word report. Times New Roman, cover page, numbered headings, tables, figure placeholders.
- `design-studio/`: reusable HTML deck template with a dark engineering aesthetic, rendered to PDF with headless Chrome.
- `cad-audit/`: Python STEP file analyzer. Extracts solids, counts fasteners and bearings by size, and emits a structured audit markdown that feeds the docs-forge pipeline.

## Order flow

Every order follows the checklist in `DELIVERY.md`: clarify scope, confirm price, produce draft, self-review, deliver, request review.

## Built by

Built by [NevoDesigns](https://nevodesigns.github.io/), a one-student studio productizing its own engineering workflows.
Follow along on [X](https://x.com/nevo_design).
