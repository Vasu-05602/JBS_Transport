const assets = require("../assets");

/**
 * Estimates the vertical height in points of a transaction row based on text lengths in columns.
 * Font size is 6.8pt with line-height ~1.08 (~7.5pt per line of text).
 * Cell vertical padding is 2.0pt top + 2.0pt bottom = 4.0pt.
 * Border is 0.5pt.
 * Total height for 1 line of text = ~12pt.
 * Each additional wrapped line adds ~7.5pt.
 */
function estimateRowHeight(row) {
  const toLen = (row.to || "").length;
  const artLen = (row.article || "").length;
  const custLen = (row.customer_name || "").length;
  const invLen = (row.InvoiceNo || "").length;
  const artNoLen = String(row.articleNo || "").length;

  const toLines = Math.ceil(toLen / 9) || 1;
  const artLines = Math.ceil(artLen / 8) || 1;
  const custLines = Math.ceil(custLen / 22) || 1;
  const invLines = Math.ceil(invLen / 8) || 1;
  const artNoLines = Math.ceil(artNoLen / 6) || 1;

  const maxLines = Math.max(1, toLines, artLines, custLines, invLines, artNoLines);
  return 13.0 + (maxLines - 1) * 8.0;
}

/**
 * Paginates an array of transaction items into page chunks targeting 28–30 rows per page.
 * Uses calibrated printable height (650pt for intermediate, 530pt for last page with footer)
 * to ensure table continues using the available page area instead of stopping prematurely at 20-22 rows.
 * @param {Array} transactions 
 * @param {number} [targetRowsPerPage=30] 
 * @returns {Array} Array of page chunk objects with { pageNumber, totalPages, isLastPage, transactions }
 */
function paginateBillTransactions(transactions, targetRowsPerPage = 30) {
  if (!transactions || transactions.length === 0) {
    return [
      {
        pageNumber: 1,
        totalPages: 1,
        isLastPage: true,
        transactions: [],
      },
    ];
  }

  // Intermediate page capacity: ~650 pt (comfortably fits 30-34 rows)
  // Last page capacity: ~530 pt (comfortably fits 28-30 rows + financial footer)
  const MAX_INTERMEDIATE_HEIGHT = 650;
  const MAX_LAST_PAGE_HEIGHT = 530;

  // Check if ALL transactions fit on a single page with footer
  let totalHeight = 0;
  for (const tx of transactions) {
    totalHeight += estimateRowHeight(tx);
  }

  if (totalHeight <= MAX_LAST_PAGE_HEIGHT && transactions.length <= targetRowsPerPage) {
    return [
      {
        pageNumber: 1,
        totalPages: 1,
        isLastPage: true,
        transactions,
      },
    ];
  }

  const chunks = [];
  let currentChunk = [];
  let currentHeight = 0;

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    const rowH = estimateRowHeight(tx);
    const remainingCount = transactions.length - (i + 1);

    const maxHeightForThisPage =
      chunks.length === 0 && remainingCount === 0
        ? MAX_LAST_PAGE_HEIGHT
        : MAX_INTERMEDIATE_HEIGHT;

    if (
      currentChunk.length > 0 &&
      (currentHeight + rowH > maxHeightForThisPage ||
        currentChunk.length >= targetRowsPerPage)
    ) {
      chunks.push(currentChunk);
      currentChunk = [tx];
      currentHeight = rowH;
    } else {
      currentChunk.push(tx);
      currentHeight += rowH;
    }
  }

  if (currentChunk.length > 0) {
    if (currentHeight > MAX_LAST_PAGE_HEIGHT && currentChunk.length > 1) {
      const splitPoint = Math.floor(
        currentChunk.length * (MAX_LAST_PAGE_HEIGHT / currentHeight)
      );
      const firstPart = currentChunk.slice(0, Math.max(1, splitPoint));
      const secondPart = currentChunk.slice(Math.max(1, splitPoint));
      chunks.push(firstPart);
      chunks.push(secondPart);
    } else {
      chunks.push(currentChunk);
    }
  }

  const totalPages = chunks.length;
  return chunks.map((chunk, idx) => ({
    pageNumber: idx + 1,
    totalPages,
    isLastPage: idx === totalPages - 1,
    transactions: chunk,
  }));
}

/**
 * Builds an in-memory pdfmake document definition for the Freight Invoice / Bill.
 * Matches multi-page behavior (28–30 items/page), 13 columns, company header, GST, totals, and words.
 * Calibrated for pixel-accurate physical print layout without column clipping or border overflow.
 * @param {object} params
 * @param {object} params.lr - Bill Data object containing pages array and financial totals
 * @param {string} [params.createdDate]
 * @param {string} [params.printDate]
 * @returns {object} pdfmake document definition
 */
function buildBillDocDefinition({ lr, createdDate, printDate }) {
  const pages =
    lr.pages && lr.pages.length > 0
      ? lr.pages
      : paginateBillTransactions(lr.transactions || []);
  const content = [];

  for (let p = 0; p < pages.length; p++) {
    const page = pages[p];
    const isLastPage = page.isLastPage;
    const pageNumber = page.pageNumber;
    const totalPages = page.totalPages;
    const currentRows = page.transactions || [];
    const rowCount = currentRows.length;

    // 1. Header (Logos + Titles)
    content.push({
      table: {
        widths: [80, "*", 80],
        body: [
          [
            {
              image: assets.jsb,
              fit: [80, 42],
              alignment: "center",
              border: [false, false, false, false],
            },
            {
              stack: [
                { text: "Freight Invoice", style: "invoiceSubTitle" },
                { text: "J.B.S. TRANSPUNE", style: "invoiceMainTitle" },
              ],
              border: [false, false, false, false],
            },
            {
              image: assets.jsb,
              fit: [80, 42],
              alignment: "center",
              border: [false, false, false, false],
            },
          ],
        ],
      },
      layout: "noBorders",
    });

    // 2. Company Address Block
    content.push({
      stack: [
        {
          text: "Jadhav Warwhouse, Gat no.2324, Priyanka Nagari, Opp. Datta Temple, Pune - Nagar Road, Wagholi, Tal, Haveli, Dist. Pune - 412 207.",
          style: "addressText",
        },
        {
          text: [
            { text: "Mob: ", bold: true },
            "8055424121, 9325247465 | ",
            { text: "Email: ", bold: true },
            "jbstranspune@gmail.com, purusotamdalai@gmail.com | ",
            { text: "J.B.S. GST No.: ", bold: true },
            "27BPOPD7785R1ZP",
          ],
          style: "addressText",
          margin: [0, 1, 0, 2],
        },
      ],
    });

    // 3. Customer Info & Bill Meta Table
    // Sized with exact numbers + star to fit 567.28 pt printable width perfectly
    content.push({
      table: {
        widths: [205, 175, "*"],
        body: [
          [
            {
              stack: [
                { text: [{ text: "Name: ", bold: true }, String(lr.customerName || "")] },
                { text: [{ text: "Address: ", bold: true }, String(lr.customerAddress || "")] },
                { text: [{ text: "Mob: ", bold: true }, String(lr.customerPhone || "")] },
              ],
            },
            {
              stack: [
                { text: [{ text: "COMPANY GST No: ", bold: true }, String(lr.customerGst || "")] },
                lr.vendorCode
                  ? { text: [{ text: "Vendor Code: ", bold: true }, String(lr.vendorCode)], margin: [0, 1, 0, 0] }
                  : { text: "" },
              ],
            },
            {
              stack: [
                { text: [{ text: "Bill No: ", bold: true }, String(lr.billNo || "")] },
                { text: [{ text: "Bill Date: ", bold: true }, String(lr.date || "")] },
              ],
            },
          ],
        ],
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => "#000000",
        vLineColor: () => "#000000",
        paddingLeft: () => 3,
        paddingRight: () => 3,
        paddingTop: () => 2,
        paddingBottom: () => 2,
      },
      style: "metaText",
      margin: [0, 0, 0, 2],
    });

    // 4. 13-Column Transactions Table
    // Column widths calibrated to fit exactly 567.28 pt usable printable width:
    // Fixed: 16 + 42 + 42 + 44 + 38 + [PartyName: * (~113 pt)] + 43 + 28 + 29 + 27 + 27 + 27 + 50 = 513 pt content
    // + 39 pt padding (13 * 3) + 7 pt borders (14 * 0.5) = 567.28 pt total flush width!
    const txTableBody = [
      [
        { text: "Sr.", style: "tblHeader", alignment: "center" },
        { text: "Date", style: "tblHeader", alignment: "center" },
        { text: "LR No.", style: "tblHeader", alignment: "center" },
        { text: "Station", style: "tblHeader", alignment: "center" },
        { text: "Article", style: "tblHeader", alignment: "center" },
        { text: "Party Name", style: "tblHeader", alignment: "center" },
        { text: "Invoice\nNo.", style: "tblHeader", alignment: "center" },
        { text: "No. of\nArticle", style: "tblHeader", alignment: "center" },
        { text: "Rate", style: "tblHeader", alignment: "center" },
        { text: "LR\nCharge", style: "tblHeader", alignment: "center" },
        { text: "Hamali", style: "tblHeader", alignment: "center" },
        { text: "DD\nCharges", style: "tblHeader", alignment: "center" },
        { text: "Amount", style: "tblHeader", alignment: "center" },
      ],
    ];

    currentRows.forEach((row) => {
      txTableBody.push([
        { text: String(row.srNo || ""), alignment: "center" },
        { text: String(row.formattedDate || ""), alignment: "center" },
        { text: String(row.formattedLRNo || ""), alignment: "center" },
        { text: String(row.to || "") },
        { text: String(row.article || "") },
        { text: String(row.customer_name || "") },
        { text: String(row.InvoiceNo || ""), alignment: "right" },
        { text: String(row.articleNo || "0"), alignment: "right" },
        { text: String(row.rate || "0.00"), alignment: "right" },
        { text: String(row.lrCharges || "0"), alignment: "right" },
        { text: String(row.hamali || "0"), alignment: "right" },
        { text: String(row.deliveryCharges || "0"), alignment: "right" },
        { text: String(row.total || "0.00"), alignment: "right" },
      ]);
    });

    // Estimate total row content height to adaptively set vertical padding
    let chunkH = 0;
    currentRows.forEach((r) => {
      chunkH += estimateRowHeight(r);
    });

    // Vertical padding calibrated to accommodate 28-30 rows while filling available page height
    const vPad = isLastPage
      ? (rowCount <= 10 ? 3.0 : (rowCount <= 20 ? 2.2 : 1.4))
      : (rowCount <= 15 ? 4.2 : (rowCount <= 25 ? 3.5 : (chunkH > 565 ? 2.0 : (chunkH > 545 ? 2.5 : 3.0))));

    content.push({
      table: {
        widths: [16, 42, 42, 44, 38, "*", 43, 28, 29, 27, 27, 27, 50],
        body: txTableBody,
      },
      layout: {
        hLineWidth: (i, node) => (isLastPage && i === node.table.body.length ? 0 : 0.5),
        vLineWidth: () => 0.5,
        hLineColor: () => "#000000",
        vLineColor: () => "#000000",
        paddingLeft: () => 1.5,
        paddingRight: () => 1.5,
        paddingTop: () => vPad,
        paddingBottom: () => vPad,
      },
      style: "txRowText",
    });

    // 5. Last Page Summary & Footer Section
    if (isLastPage) {
      const summaryPad = rowCount <= 10 ? 2.2 : 1.5;

      // Integrated Single-Table Financial Summary & Totals
      content.push({
        table: {
          widths: ["*", 90, 35, 65],
          body: [
            [
              {
                rowSpan: 6,
                stack: [
                  { text: [{ text: "Total Articles: ", bold: true }, String(lr.totalArticles || "0")] },
                  { text: [{ text: "Total Weight: ", bold: true }, String(lr.totalWeight || "0.00")], margin: [0, 3, 0, 0] },
                ],
                alignment: "left",
                margin: [2, 2, 2, 2],
              },
              { text: "Total Freight", bold: true, fontSize: 7 },
              { text: "", fontSize: 7 },
              { text: String(lr.totalFreight || "0.00"), alignment: "right", fontSize: 7 },
            ],
            [
              {},
              { text: "Other Freight", fontSize: 7 },
              { text: "", fontSize: 7 },
              { text: String(lr.freight || "0.00"), alignment: "right", fontSize: 7 },
            ],
            [
              {},
              { text: "Local Freight", fontSize: 7 },
              { text: "", fontSize: 7 },
              { text: String(lr.localFreight || "0.00"), alignment: "right", fontSize: 7 },
            ],
            [
              {},
              { text: "CGST", fontSize: 7 },
              { text: `${lr.cgstPercent || "0"}%`, alignment: "center", fontSize: 7 },
              { text: String(lr.cgst || "0.00"), alignment: "right", fontSize: 7 },
            ],
            [
              {},
              { text: "SGST", fontSize: 7 },
              { text: `${lr.sgstPercent || "0"}%`, alignment: "center", fontSize: 7 },
              { text: String(lr.sgst || "0.00"), alignment: "right", fontSize: 7 },
            ],
            [
              {},
              { text: "Total", bold: true, fontSize: 7.5 },
              { text: "", fontSize: 7.5 },
              { text: String(lr.grandTotal || "0.00"), alignment: "right", bold: true, fontSize: 7.5 },
            ],
          ],
        },
        layout: {
          hLineWidth: (i, node) => (i === node.table.body.length ? 0 : 0.5),
          vLineWidth: () => 0.5,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
          paddingLeft: () => 3,
          paddingRight: () => 3,
          paddingTop: () => summaryPad,
          paddingBottom: () => summaryPad,
        },
        style: "metaText",
      });

      // Amount in Words
      content.push({
        table: {
          widths: ["*"],
          body: [
            [
              {
                text: [{ text: "In Words: ", bold: true }, `${String(lr.totalInWords || "").toUpperCase()} ONLY`],
                fontSize: 7.2,
                bold: true,
              },
            ],
          ],
        },
        layout: {
          hLineWidth: (i, node) => (i === node.table.body.length ? 0 : 0.5),
          vLineWidth: () => 0.5,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
          paddingLeft: () => 3,
          paddingRight: () => 3,
          paddingTop: () => summaryPad,
          paddingBottom: () => summaryPad,
        },
      });

      // Remark & Sign-off
      content.push({
        table: {
          widths: ["*", 175],
          body: [
            [
              {
                text: [{ text: "Remark: ", bold: true }, String(lr.remark || "")],
                fontSize: 7.2,
              },
              {
                stack: [
                  { text: "", margin: [0, rowCount <= 15 ? 18 : (rowCount <= 25 ? 12 : 8), 0, 0] },
                  { text: "For J.B.S. Transpune", bold: true, alignment: "center", fontSize: 7.5 },
                ],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: (i, node) => (i === node.table.body.length ? 0.5 : 0.5),
          vLineWidth: () => 0.5,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
          paddingLeft: () => 3,
          paddingRight: () => 3,
          paddingTop: () => summaryPad,
          paddingBottom: () => summaryPad,
        },
      });

      // Transportation Disclaimer
      content.push({
        table: {
          widths: ["*"],
          body: [
            [
              {
                text: "BEING TRANSPORTATION CHARGES FOR YOUR GOODS AS PER DETAIL",
                fontSize: 6.8,
                bold: true,
                alignment: "center",
              },
            ],
          ],
        },
        layout: {
          hLineWidth: (i, node) => (i === 0 ? 0 : 0.5),
          vLineWidth: () => 0.5,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
          paddingLeft: () => 3,
          paddingRight: () => 3,
          paddingTop: () => summaryPad,
          paddingBottom: () => summaryPad,
        },
      });

      // Computer generated bill notice
      content.push({
        stack: [
          {
            columns: [
              createdDate ? { text: `Created Date: ${createdDate}`, fontSize: 6.5, alignment: "left" } : { text: "" },
              printDate ? { text: `Print Date: ${printDate}`, fontSize: 6.5, alignment: "right" } : { text: "" },
            ],
            margin: [0, 2, 0, 1],
          },
          {
            text: "This is Computer Generated Bill, does not require Signature",
            fontSize: 7,
            bold: true,
            alignment: "center",
          },
        ],
      });
    }

    // Page number bottom footer
    content.push({
      text: `Page ${pageNumber} of ${totalPages}`,
      alignment: "right",
      fontSize: 7,
      margin: [0, 2, 0, 0],
    });

    // Page break between pages
    if (!isLastPage) {
      content.push({ text: "", pageBreak: "after" });
    }
  }

  return {
    pageSize: "A4",
    pageOrientation: "portrait",
    pageMargins: [14, 10, 14, 10],
    defaultStyle: {
      font: "Times",
      fontSize: 7,
      color: "#000000",
      lineHeight: 1.08,
    },
    styles: {
      invoiceMainTitle: {
        font: "Times",
        fontSize: 15,
        bold: true,
        alignment: "center",
      },
      invoiceSubTitle: {
        font: "Times",
        fontSize: 11,
        bold: true,
        alignment: "center",
      },
      addressText: {
        fontSize: 7.2,
        alignment: "center",
        lineHeight: 1.12,
      },
      metaText: {
        fontSize: 7.5,
        lineHeight: 1.12,
      },
      tblHeader: {
        fontSize: 7.5,
        bold: true,
      },
      txRowText: {
        fontSize: 7.2,
        lineHeight: 1.08,
      },
    },
    content,
  };
}

module.exports = {
  buildBillDocDefinition,
  paginateBillTransactions,
  estimateRowHeight,
};
