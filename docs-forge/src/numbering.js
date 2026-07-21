// Multilevel heading numbering for NevoForge reports.
// Produces 1. / 1.1 / 1.1.1 style numbers on Heading 1 to Heading 3.

const { AlignmentType, LevelFormat } = require("docx");

const HEADING_NUMBERING = "nevoforge-headings";

const numbering = {
  config: [
    {
      reference: HEADING_NUMBERING,
      levels: [
        {
          level: 0,
          format: LevelFormat.DECIMAL,
          text: "%1.",
          alignment: AlignmentType.START,
          style: { paragraph: { indent: { left: 0, hanging: 0 } } },
        },
        {
          level: 1,
          format: LevelFormat.DECIMAL,
          text: "%1.%2",
          alignment: AlignmentType.START,
          style: { paragraph: { indent: { left: 0, hanging: 0 } } },
        },
        {
          level: 2,
          format: LevelFormat.DECIMAL,
          text: "%1.%2.%3",
          alignment: AlignmentType.START,
          style: { paragraph: { indent: { left: 0, hanging: 0 } } },
        },
      ],
    },
  ],
};

// Attach to a heading paragraph: numbering: headingNumbering(level)
// where level is the markdown heading depth 1..3.
function headingNumbering(mdLevel) {
  return { reference: HEADING_NUMBERING, level: mdLevel - 1 };
}

module.exports = { numbering, headingNumbering };
