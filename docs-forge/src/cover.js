// Cover page block for NevoForge reports.
// Renders title, subtitle, a rule line, and a client/author/date block,
// then a page break so the body starts on page 2.

const {
  AlignmentType,
  BorderStyle,
  PageBreak,
  Paragraph,
  TextRun,
} = require("docx");
const { SIZES } = require("./template");

// meta: { title, subtitle, client, author, date }
function buildCoverPage(meta) {
  const children = [];

  // Push the title block down from the top of the page.
  children.push(new Paragraph({ spacing: { before: 3600 }, children: [] }));

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: meta.title || "Untitled Report", size: SIZES.title, bold: true }),
      ],
    })
  );

  if (meta.subtitle) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({ text: meta.subtitle, size: SIZES.subtitle, italics: true }),
        ],
      })
    );
  }

  // Horizontal rule under the title block.
  children.push(
    new Paragraph({
      spacing: { before: 200, after: 2400 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 8, space: 1, color: "404040" },
      },
      children: [],
    })
  );

  const detailRows = [
    ["Prepared for", meta.client],
    ["Prepared by", meta.author],
    ["Date", meta.date],
  ];
  for (const [label, value] of detailRows) {
    if (!value) continue;
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new TextRun({ text: `${label}: `, bold: true, size: SIZES.subtitle }),
          new TextRun({ text: value, size: SIZES.subtitle }),
        ],
      })
    );
  }

  children.push(new Paragraph({ children: [new PageBreak()] }));
  return children;
}

module.exports = { buildCoverPage };
