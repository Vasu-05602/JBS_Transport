// Common table layouts and styling tokens for pdfmake documents

const tableLayouts = {
  cleanTable: {
    hLineWidth: () => 0.75,
    vLineWidth: () => 0.75,
    hLineColor: () => "#333333",
    vLineColor: () => "#333333",
    paddingLeft: () => 3,
    paddingRight: () => 3,
    paddingTop: () => 2,
    paddingBottom: () => 2,
  },
  compactTable: {
    hLineWidth: () => 0.5,
    vLineWidth: () => 0.5,
    hLineColor: () => "#000000",
    vLineColor: () => "#000000",
    paddingLeft: () => 2,
    paddingRight: () => 2,
    paddingTop: () => 1.5,
    paddingBottom: () => 1.5,
  },
  borderless: {
    hLineWidth: () => 0,
    vLineWidth: () => 0,
    paddingLeft: () => 0,
    paddingRight: () => 0,
    paddingTop: () => 0,
    paddingBottom: () => 0,
  },
};

module.exports = { tableLayouts };
