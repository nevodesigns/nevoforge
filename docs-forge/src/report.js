// NevoForge report pipeline entry point.
// Usage: node src/report.js <input.md> [output.docx]
//
// Input is structured markdown with optional YAML-style frontmatter:
//   ---
//   title: Report Title
//   subtitle: Optional subtitle
//   client: Client name
//   author: Author name
//   date: 2026-07-21
//   ---
//   # Section
//   Body text with **bold** and *italic*.
//   | Col A | Col B |
//   |---|---|
//   | 1 | 2 |
//   ![Figure caption](placeholder)

const fs = require("fs");
const path = require("path");
const { Document, HeadingLevel, Packer, Paragraph, TextRun } = require("docx");
const {
  styles,
  bodyParagraph,
  buildTable,
  buildFigurePlaceholder,
  buildFooter,
} = require("./template");
const { buildCoverPage } = require("./cover");
const { numbering, headingNumbering } = require("./numbering");

// Split frontmatter (between leading --- fences) from the markdown body.
function parseFrontmatter(source) {
  const meta = {};
  let body = source;
  const m = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (m) {
    for (const line of m[1].split(/\r?\n/)) {
      const kv = line.match(/^(\w+)\s*:\s*(.+)$/);
      if (kv) meta[kv[1].toLowerCase()] = kv[2].trim();
    }
    body = source.slice(m[0].length);
  }
  return { meta, body };
}

// Minimal inline parser: **bold** and *italic* runs.
function parseInline(text) {
  const runs = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) runs.push({ text: text.slice(last, m.index) });
    if (m[2] !== undefined) runs.push({ text: m[2], bold: true });
    else runs.push({ text: m[3], italics: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) runs.push({ text: text.slice(last) });
  return runs.length ? runs : [{ text }];
}

const HEADING_LEVELS = [
  HeadingLevel.HEADING_1,
  HeadingLevel.HEADING_2,
  HeadingLevel.HEADING_3,
];

// Build a numbered heading paragraph for markdown level 1..3.
function buildHeading(text, level) {
  return new Paragraph({
    heading: HEADING_LEVELS[level - 1],
    numbering: headingNumbering(level),
    children: [new TextRun({ text: ` ${text}` })],
  });
}

function isTableRow(line) {
  return /^\s*\|.*\|\s*$/.test(line);
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

// Parse the markdown body into docx children.
function buildBody(markdown) {
  const children = [];
  const lines = markdown.split(/\r?\n/);
  let figureCount = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      children.push(buildHeading(heading[2].trim(), heading[1].length));
      i += 1;
      continue;
    }

    const figure = line.match(/^!\[([^\]]*)\]\([^)]*\)\s*$/);
    if (figure) {
      figureCount += 1;
      children.push(...buildFigurePlaceholder(figure[1] || "untitled", figureCount));
      i += 1;
      continue;
    }

    if (isTableRow(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const header = splitTableRow(line);
      const rows = [];
      i += 2;
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(splitTableRow(lines[i]));
        i += 1;
      }
      children.push(buildTable(header, rows));
      continue;
    }

    // Plain paragraph: gather consecutive non-blank, non-structural lines.
    const buf = [line.trim()];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^#{1,3}\s/.test(lines[i]) &&
      !isTableRow(lines[i]) &&
      !/^!\[/.test(lines[i])
    ) {
      buf.push(lines[i].trim());
      i += 1;
    }
    children.push(bodyParagraph(parseInline(buf.join(" "))));
  }

  return children;
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("usage: node src/report.js <input.md> [output.docx]");
    process.exit(1);
  }

  // Client notes are untrusted input. Refuse oversized files up front with a
  // clear message rather than letting the process exhaust memory.
  const MAX_INPUT_BYTES = 5 * 1024 * 1024; // 5 MB
  let stat;
  try {
    stat = fs.statSync(inputPath);
  } catch (e) {
    console.error(`error: cannot read input file: ${inputPath}`);
    process.exit(2);
  }
  if (!stat.isFile()) {
    console.error(`error: not a file: ${inputPath}`);
    process.exit(2);
  }
  if (stat.size === 0) {
    console.error(`error: ${inputPath}: file is empty`);
    process.exit(2);
  }
  if (stat.size > MAX_INPUT_BYTES) {
    console.error(
      `error: ${inputPath}: file is ${(stat.size / 1048576).toFixed(1)} MB, ` +
        `limit is ${MAX_INPUT_BYTES / 1048576} MB. Ask the client to split the notes.`
    );
    process.exit(2);
  }

  const source = fs.readFileSync(inputPath, "utf8");
  const { meta, body } = parseFrontmatter(source);

  const outputPath =
    process.argv[3] ||
    path.join(
      __dirname,
      "..",
      "output",
      path.basename(inputPath).replace(/\.md$/i, "") + ".docx"
    );

  const doc = new Document({
    title: meta.title || path.basename(inputPath),
    styles,
    numbering,
    sections: [
      {
        footers: { default: buildFooter() },
        children: [...buildCoverPage(meta), ...buildBody(body)],
      },
    ],
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`wrote ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
