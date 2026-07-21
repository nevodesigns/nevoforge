// NevoForge report template: fonts, styles, tables, figure placeholders.
// All sizes are in half-points (docx convention), spacing in twips.

const {
  AlignmentType,
  BorderStyle,
  Footer,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} = require("docx");

const FONT = "Times New Roman";

const SIZES = {
  body: 24, // 12pt
  h1: 32, // 16pt
  h2: 28, // 14pt
  h3: 26, // 13pt
  caption: 20, // 10pt
  title: 56, // 28pt
  subtitle: 30, // 15pt
};

// Document-wide style definitions. Everything is Times New Roman.
const styles = {
  default: {
    document: {
      run: { font: FONT, size: SIZES.body },
    },
    heading1: {
      run: { font: FONT, size: SIZES.h1, bold: true, color: "000000" },
      paragraph: { spacing: { before: 320, after: 160 } },
    },
    heading2: {
      run: { font: FONT, size: SIZES.h2, bold: true, color: "000000" },
      paragraph: { spacing: { before: 240, after: 120 } },
    },
    heading3: {
      run: { font: FONT, size: SIZES.h3, bold: true, italics: true, color: "000000" },
      paragraph: { spacing: { before: 200, after: 100 } },
    },
  },
  paragraphStyles: [
    {
      id: "BodyText",
      name: "Body Text",
      basedOn: "Normal",
      next: "BodyText",
      run: { font: FONT, size: SIZES.body },
      paragraph: {
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 160, line: 300 },
      },
    },
    {
      id: "FigCaption",
      name: "Figure Caption",
      basedOn: "Normal",
      next: "BodyText",
      run: { font: FONT, size: SIZES.caption, italics: true },
      paragraph: {
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 240 },
      },
    },
  ],
};

// Body paragraph from a list of TextRun options ({text, bold, italics}).
function bodyParagraph(runs) {
  return new Paragraph({
    style: "BodyText",
    children: runs.map((r) => new TextRun(r)),
  });
}

// Data table: first row is the header, shaded and bold. Full page width.
function buildTable(headerCells, bodyRows) {
  const makeCell = (text, isHeader) =>
    new TableCell({
      shading: isHeader ? { fill: "E8E8E8" } : undefined,
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [
        new Paragraph({
          children: [new TextRun({ text, bold: isHeader, size: SIZES.body })],
        }),
      ],
    });

  const rows = [
    new TableRow({
      tableHeader: true,
      children: headerCells.map((c) => makeCell(c, true)),
    }),
    ...bodyRows.map(
      (cells) => new TableRow({ children: cells.map((c) => makeCell(c, false)) })
    ),
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}

// Figure placeholder: dashed box with a centered marker, followed by a
// numbered caption. The real image is dropped in during final assembly.
function buildFigurePlaceholder(caption, index) {
  const dashed = { style: BorderStyle.DASHED, size: 6, space: 8, color: "808080" };
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 0 },
      border: { top: dashed, bottom: dashed, left: dashed, right: dashed },
      children: [
        new TextRun({ text: "[ Insert figure here ]", color: "808080" }),
      ],
    }),
    new Paragraph({
      style: "FigCaption",
      children: [new TextRun({ text: `Figure ${index}: ${caption}` })],
    }),
  ];
}

// Page footer with a centered page number.
function buildFooter() {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ children: [PageNumber.CURRENT], size: SIZES.caption }),
        ],
      }),
    ],
  });
}

module.exports = {
  FONT,
  SIZES,
  styles,
  bodyParagraph,
  buildTable,
  buildFigurePlaceholder,
  buildFooter,
};
