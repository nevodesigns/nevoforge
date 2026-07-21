# NevoForge Delivery Checklist

Every order follows this sequence. No step is skipped, no matter how small the job.

## 1. Clarify scope

- [ ] Restate the client's request in one or two sentences and get their confirmation.
- [ ] List exactly what will be delivered: file formats, page or slide count, level of detail.
- [ ] List what the client must provide (notes, brief, STEP file, brand assets) and confirm it has all arrived.
- [ ] Flag anything out of scope now, not at delivery.

## 2. Confirm price

- [ ] Quote a single figure in USDT based on the base rate and the clarified scope.
  - Engineering Docs Forge: 5 to 15 per document depending on length.
  - Technical Design Studio: 10 to 30 per deliverable.
  - CAD Design Audit: 20 to 50 per audit.
- [ ] Get explicit client agreement on the figure before any work starts.
- [ ] Record the agreed scope and price in the task thread.

## 3. Produce draft

- [ ] Run the matching pipeline:
  - Reports: structure the notes into markdown, then `docs-forge` (`node src/report.js input.md`).
  - Decks and visuals: duplicate `design-studio/deck-template.html`, fill content, then `./build-pdf.sh`.
  - CAD audits: `cad-audit/audit_report.py model.step`, complete the findings section by hand, then feed the markdown to docs-forge.
- [ ] Replace every figure placeholder with a real image or remove it deliberately.
- [ ] Fill every template placeholder. No "Goes Here" text may survive into a draft.

## 4. Self-review against checklist

- [ ] Content: every scope item from step 1 is present in the deliverable.
- [ ] Formatting: fonts consistent, headings numbered correctly, tables aligned, no orphan headings.
- [ ] Language: no em dashes anywhere. No typos. Plain professional wording.
- [ ] Numbers: every count, size, and figure cross-checked against the source material.
- [ ] For CAD audits: every item in Load and Design Concerns has a matching answer in Findings.
- [ ] Open the final file the way the client will (Word for docx, a PDF reader for decks) and page through it once.

## 5. Deliver

- [ ] Send the deliverable in the agreed format through the task thread.
- [ ] Include a two or three sentence summary of what was done and any assumptions made.
- [ ] Attach source markdown or HTML when the client asked for editable files.

## 6. Request review

- [ ] Ask the client to confirm the deliverable meets the agreed scope.
- [ ] Resolve revision requests that fall inside scope at no extra charge, once.
- [ ] After acceptance, request a rating and short review on the marketplace.
