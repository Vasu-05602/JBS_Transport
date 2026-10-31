const assets = require("../assets");
const { generateBarcodeDataUri } = require("../barcode");

/**
 * Builds an in-memory pdfmake document definition for the bilingual Lorry Receipt (3 copies stacked).
 * @param {object} params
 * @param {object} params.lr - LR Data object
 * @param {string} params.printDate - Formatted print date string
 * @param {string} [params.user] - User name
 * @returns {Promise<object>} pdfmake document definition
 */
async function buildLorryReceiptDocDefinition({ lr, printDate, user }) {
  const barcodeUri = await generateBarcodeDataUri(lr.lrNo, {
    scale: 2,
    height: 8,
    textsize: 10,
    includetext: true,
  });

  const copies = [
    { label: "CONSIGNOR COPY" },
    { label: "CONSIGNEE COPY" },
    { label: "DRIVER COPY" },
  ];

  const content = [];

  for (let i = 0; i < copies.length; i++) {
    const copy = copies[i];
    const copyContent = buildSingleCopy({
      lr,
      printDate,
      user,
      copyLabel: copy.label,
      barcodeUri,
    });

    content.push(copyContent);

    // Dashed line separator between copies (not after the last copy)
    if (i < copies.length - 1) {
      content.push({
        margin: [0, 16, 0, 16],
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 0,
            x2: 567,
            y2: 0,
            dash: { length: 4, space: 3 },
            lineWidth: 0.75,
            lineColor: "#444444",
          },
        ],
      });
    }
  }

  return {
    pageSize: "A4",
    pageOrientation: "portrait",
    pageMargins: [14, 10, 14, 10],
    defaultStyle: {
      font: "Roboto",
      fontSize: 8,
      color: "#000000",
      lineHeight: 1.1,
    },
    styles: {
      headerTag: {
        font: "Times",
        fontSize: 7.5,
        bold: true,
        alignment: "center",
      },
      companyTitle: {
        font: "Times",
        fontSize: 15.5,
        bold: true,
        color: "#c00000",
        alignment: "center",
      },
      subHeader: {
        fontSize: 6.8,
        alignment: "center",
        lineHeight: 1.12,
      },
      tableHeader: {
        fontSize: 8,
        bold: true,
        alignment: "center",
        fillColor: "#f0f0f0",
      },
      marathiText: {
        font: "NotoSansDevanagari",
        fontSize: 5.8,
        lineHeight: 1.1,
      },
      badge: {
        fontSize: 7.5,
        bold: true,
        fillColor: "#dddddd",
        alignment: "center",
      },
    },
    content,
  };
}

/**
 * Builds a single LR copy container
 */
function buildSingleCopy({ lr, printDate, user, copyLabel, barcodeUri }) {
  // Checkbox icon helper
  const isPaid = !!lr.isPaid;
  const isToPay = !!lr.isToPay;
  const isTBB = !!lr.isTBB;

  const checkedIcon = assets.checked;
  const uncheckedIcon = assets.unchecked;

  // Prepare transaction lines
  const txRows = Array.isArray(lr.transactions) ? lr.transactions : [];
  const articleNos = [];
  const articleDescs = [];
  const rates = [];

  txRows.forEach((tx) => {
    articleNos.push(String(tx.articleNo || ""));
    articleDescs.push(String(tx.article || tx.description || ""));
    rates.push(tx.rate ? String(tx.rate) : "");
  });

  const articleNoText = articleNos.join("\n") || " ";
  const articleDescText = articleDescs.join("\n") || " ";
  const rateText = rates.join("\n") || " ";
  const invoiceNoText = String(lr.invoiceNo || "-");

  return {
    unbreakable: true,
    stack: [
      // 1. Header Table
      {
        table: {
          widths: [52, "*", 52, 98, 65],
          body: [
            [
              // Col 0: Left Logo (no right or bottom border)
              {
                image: assets.jsb,
                fit: [50, 42],
                alignment: "center",
                rowSpan: 3,
                border: [true, true, false, false],
              },
              // Col 1: Center Company Info (no left, right, or bottom border)
              {
                stack: [
                  { text: "Jai Jagannath", style: "headerTag" },
                  { text: "J.B.S. TRANSPUNE", style: "companyTitle", margin: [0, 0, 0, 1] },
                  {
                    text: "Jadhav Warehouse, Gat no.2324, Priyanka Nagari, opp. Datta Temple, Pune-Nagar Road, Wagholi, Tal. Haveli, Dist. Pune-412207",
                    style: "subHeader",
                  },
                  {
                    text: "Mob. No. 8055424121 / 9325247465, Email: jbstranspune@gmail.com / purusotamdalai@gmail.com",
                    style: "subHeader",
                  },
                ],
                rowSpan: 3,
                border: [false, true, false, false],
              },
              // Col 2: Secondary Logo (no left or bottom border, has right border)
              {
                image: assets.jsb,
                fit: [50, 42],
                alignment: "center",
                rowSpan: 3,
                border: [false, true, true, false],
              },
              // Col 3: Barcode
              barcodeUri
                ? {
                    image: barcodeUri,
                    fit: [94, 25],
                    alignment: "center",
                    border: [true, true, false, true],
                  }
                : { text: lr.lrNo || "", bold: true, fontSize: 10.5, alignment: "center", border: [true, true, false, true] },
              // Col 4: Date
              {
                stack: [
                  { text: "Date:", bold: true, fontSize: 7 },
                  { text: lr.date || "", bold: true, fontSize: 8 },
                ],
                border: [false, true, true, true],
              },
            ],
            // Row 2: From Place
            [
              {},
              {},
              {},
              {
                text: [{ text: "From: ", bold: true }, { text: lr.from || "" }],
                colSpan: 2,
                fontSize: 8,
                border: [true, true, true, true],
              },
              {},
            ],
            // Row 3: To Place
            [
              {},
              {},
              {},
              {
                text: [{ text: "To: ", bold: true }, { text: lr.to || "" }],
                colSpan: 2,
                fontSize: 8,
                border: [true, true, true, false],
              },
              {},
            ],
          ],
        },
        layout: {
          hLineWidth: (i, node) => (i === node.table.body.length ? 0 : 0.6),
          vLineWidth: () => 0.6,
          hLineColor: () => "#333333",
          vLineColor: () => "#333333",
          paddingLeft: () => 2.5,
          paddingRight: () => 2.5,
          paddingTop: () => 2,
          paddingBottom: () => 2,
        },
      },

      // 2. Consignor / Consignee Table
      {
        table: {
          widths: ["*", 125, 130],
          body: [
            [
              {
                text: [{ text: "Consignor: ", bold: true }, { text: lr.consignorName || "" }],
                fontSize: 8,
                border: [true, true, false, true],
              },
              {
                text: [{ text: "Mobile: ", bold: true }, { text: lr.consignorPhone || "" }],
                fontSize: 8,
                border: [false, true, true, true],
              },
              {
                text: "E-Way Bill no.",
                fontSize: 8,
                alignment: "center",
                bold: true,
                border: [true, true, true, true],
              },
            ],
            [
              {
                text: [{ text: "Consignee: ", bold: true }, { text: lr.consigneeName || "" }],
                fontSize: 8,
                border: [true, true, false, false],
              },
              {
                text: [{ text: "Mobile: ", bold: true }, { text: lr.consigneePhone || "" }],
                fontSize: 8,
                border: [false, true, true, false],
              },
              {
                text: lr.eWayBillNo || "-",
                fontSize: 8,
                alignment: "center",
                border: [true, true, true, false],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: (i, node) => (i === node.table.body.length ? 0 : 0.6),
          vLineWidth: () => 0.6,
          hLineColor: () => "#333333",
          vLineColor: () => "#333333",
          paddingLeft: () => 2.5,
          paddingRight: () => 2.5,
          paddingTop: () => 2,
          paddingBottom: () => 2,
        },
      },

      // 3. Transactions & Charges Table
      {
        table: {
          widths: [45, "*", 90, 45, 115, 65],
          body: [
            // Header Row
            [
              { text: "No. of Pkg.", style: "tableHeader" },
              { text: "Description (Said to Content)", style: "tableHeader" },
              { text: "Invoice No", style: "tableHeader" },
              { text: "Rate", style: "tableHeader" },
              { text: "Freight", bold: true, fontSize: 8 },
              { text: lr.totalFreight ? String(lr.totalFreight) : "", alignment: "right", fontSize: 8 },
            ],
            // Content Row with Nested Breakdown
            [
              { text: articleNoText, alignment: "center", fontSize: 8 },
              { text: articleDescText, alignment: "center", fontSize: 8 },
              { text: invoiceNoText, alignment: "center", fontSize: 8 },
              { text: rateText, alignment: "center", fontSize: 8 },
              {
                colSpan: 2,
                margin: [-2.5, -1.8, -2.5, -1.8],
                table: {
                  widths: ["*", 63],
                  body: [
                    [
                      { text: "Door delivery", fontSize: 7.5, border: [false, false, true, true] },
                      { text: lr.deliveryCharges ? String(lr.deliveryCharges) : "", alignment: "right", fontSize: 7.5, border: [false, false, false, true] },
                    ],
                    [
                      { text: "Hamali", fontSize: 7.5, border: [false, false, true, true] },
                      { text: lr.hamali ? String(lr.hamali) : "", alignment: "right", fontSize: 7.5, border: [false, false, false, true] },
                    ],
                    [
                      { text: "Billty charges", fontSize: 7.5, border: [false, false, true, true] },
                      { text: lr.lrCharges ? String(lr.lrCharges) : "", alignment: "right", fontSize: 7.5, border: [false, false, false, true] },
                    ],
                    [
                      { text: "Other", fontSize: 7.5, border: [false, false, true, true] },
                      { text: "0", alignment: "right", fontSize: 7.5, border: [false, false, false, true] },
                    ],
                    [
                      { text: "Total", bold: true, fontSize: 8.5, border: [false, false, true, false] },
                      { text: String(lr.total || ""), bold: true, alignment: "right", fontSize: 8.5, border: [false, false, false, false] },
                    ],
                  ],
                },
                layout: {
                  hLineWidth: () => 0.5,
                  vLineWidth: () => 0.5,
                  hLineColor: () => "#333333",
                  vLineColor: () => "#333333",
                  paddingLeft: () => 2.5,
                  paddingRight: () => 2.5,
                  paddingTop: () => 1.8,
                  paddingBottom: () => 1.8,
                },
              },
              {},
            ],
          ],
        },
        layout: {
          hLineWidth: (i, node) => (i === node.table.body.length ? 0 : 0.6),
          vLineWidth: () => 0.6,
          hLineColor: () => "#333333",
          vLineColor: () => "#333333",
          paddingLeft: () => 2.5,
          paddingRight: () => 2.5,
          paddingTop: () => 1.8,
          paddingBottom: () => 1.8,
        },
      },

      // 4. Footer Table with Checkboxes, Marathi Legal clauses, and Signatures
      {
        table: {
          widths: ["*", 95, 85],
          body: [
            [
              // Left cell: Payment modes, Copy Label, Marathi declarations
              {
                stack: [
                  // Row with Checkboxes + Copy Badge + Jurisdiction
                  {
                    columns: [
                      {
                        width: "auto",
                        columns: [
                          { text: "PAID ", fontSize: 7.5, bold: true },
                          { image: isPaid ? checkedIcon : uncheckedIcon, width: 9, height: 9, margin: [1, 0, 4, 0] },
                          { text: "TO PAY ", fontSize: 7.5, bold: true },
                          { image: isToPay ? checkedIcon : uncheckedIcon, width: 9, height: 9, margin: [1, 0, 4, 0] },
                          { text: "BILLING ", fontSize: 7.5, bold: true },
                          { image: isTBB ? checkedIcon : uncheckedIcon, width: 9, height: 9, margin: [1, 0, 4, 0] },
                        ],
                      },
                      {
                        width: "auto",
                        table: {
                          widths: ["auto"],
                          body: [[{ text: copyLabel, style: "badge", margin: [3, 0.5, 3, 0.5] }]],
                        },
                        layout: "noBorders",
                        margin: [4, -1, 4, 0],
                      },
                      {
                        width: "*",
                        text: "Subject to Pune Jurisdiction",
                        fontSize: 6.5,
                        alignment: "right",
                        color: "#333333",
                      },
                    ],
                    margin: [0, 0, 0, 2],
                  },
                  // Marathi Clause 1 & GST / Print Date
                  {
                    table: {
                      widths: [225, "auto", "*"],
                      body: [
                        [
                          {
                            text: "काचसामान आणि तेल डब्याची मोडतोड झाल्यास आम्ही जवाबदार नाही",
                            font: "NotoSansDevanagari",
                            fontSize: 5.8,
                            lineHeight: 1.1,
                            border: [false, false, false, false],
                          },
                          {
                            text: "GSTIN: 27BPOPD7785R1ZP",
                            fontSize: 6,
                            bold: true,
                            border: [false, false, false, false],
                          },
                          {
                            text: `LR Print Date: ${printDate}`,
                            fontSize: 6,
                            alignment: "right",
                            border: [false, false, false, false],
                          },
                        ],
                      ],
                    },
                    layout: "noBorders",
                    margin: [0, 0, 0, 1.5],
                  },
                  // Marathi Clause 2
                  {
                    text: [
                      { text: "मालाबद्दल कोणत्याही प्रकारची तक्रार ७ दिवसांच्या आत लेखी करावी", font: "NotoSansDevanagari" },
                      { text: ". " },
                      { text: "अन्यथा आमची जबाबदारी नाही", font: "NotoSansDevanagari" },
                      { text: "." },
                    ],
                    fontSize: 5.8,
                    lineHeight: 1.1,
                  },
                ],
              },
              // Center cell: Receiver Signature
              {
                stack: [
                  { text: "", margin: [0, 14, 0, 0] },
                  { text: "Receiver's Signature With Stamp", fontSize: 7, bold: true, alignment: "center" },
                ],
              },
              // Right cell: Company Signature
              {
                stack: [
                  { text: user || " ", fontSize: 7.5, alignment: "center" },
                  { text: "", margin: [0, 8, 0, 0] },
                  { text: "For J.B.S. TRANSPUNE", fontSize: 7, bold: true, alignment: "center" },
                ],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.6,
          vLineWidth: () => 0.6,
          hLineColor: () => "#333333",
          vLineColor: () => "#333333",
          paddingLeft: () => 2.5,
          paddingRight: () => 2.5,
          paddingTop: () => 2,
          paddingBottom: () => 2,
        },
      },
    ],
  };
}

module.exports = { buildLorryReceiptDocDefinition };
