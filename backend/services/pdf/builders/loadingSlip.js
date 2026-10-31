const assets = require("../assets");

/**
 * Builds an in-memory pdfmake document definition for the Loading Slip / Challan.
 * Matches multi-page behavior (20 items/page), header, driver info, terms, and financial breakdown.
 * Optimizes vertical height to eliminate excessive bottom whitespace and enhances font readability.
 * @param {object} params
 * @param {object} params.lsData - Loading Slip data object (with pages array or raw lrList)
 * @returns {object} pdfmake document definition
 */
function buildLoadingSlipDocDefinition({ lsData }) {
  const pages = lsData.pages || [];
  const content = [];
  const uncheckedIcon = assets.unchecked;

  for (let p = 0; p < pages.length; p++) {
    const page = pages[p];
    const isFirstPage = p === 0;
    const isLastPage = page.isLastPage;
    const pageNumber = page.pageNumber;
    const totalPages = page.totalPages;
    const currentRows = page.lrList || [];
    const rowCount = currentRows.length;

    // 1. Header (Logos + Titles)
    content.push({
      table: {
        widths: [75, "*", 75],
        body: [
          [
            {
              image: assets.jsb,
              fit: [70, 42],
              alignment: "center",
              border: [false, false, false, false],
            },
            {
              stack: [
                { text: "J.B.S. TRANSPUNE", style: "mainTitle" },
                { text: "Lorry Receipt Challan", style: "subTitle" },
              ],
              border: [false, false, false, false],
            },
            {
              image: assets.jsb,
              fit: [70, 42],
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
          margin: [0, 1, 0, 3],
        },
      ],
    });

    // 3. Challan Meta Row Table
    content.push({
      table: {
        widths: [98, 160, 90, 132, 87.28],
        body: [
          [
            { text: [{ text: "LFSD No: ", bold: true }, String(lsData.lsNo || "")] },
            { text: [{ text: "Vehicle No: ", bold: true }, String(lsData.vehicleNo || "")] },
            { text: [{ text: "From: ", bold: true }, String(lsData.fromName || "")] },
            { text: [{ text: "To: ", bold: true }, String(lsData.toName || "")] },
            { text: [{ text: "Date: ", bold: true }, String(lsData.date || "")] },
          ],
        ],
      },
      layout: {
        hLineWidth: (i, node) => (i === node.table.body.length ? 0 : 0.6),
        vLineWidth: () => 0.6,
        hLineColor: () => "#000000",
        vLineColor: () => "#000000",
        paddingLeft: () => 3,
        paddingRight: () => 3,
        paddingTop: () => 2.5,
        paddingBottom: () => 2.5,
      },
      style: "metaText",
    });

    // 4. Driver & Vehicle Info Table
    content.push({
      table: {
        widths: [158, 194, 215.28],
        body: [
          [
            {
              stack: [
                { text: [{ text: "Owner Name: ", bold: true }, String(lsData.vehicleOwner || "")] },
                { text: [{ text: "Address: ", bold: true }, String(lsData.vehicleOwnerAddress || "")] },
                { text: [{ text: "Contact No: ", bold: true }, String(lsData.vehicleOwnerPhone || "")] },
              ],
            },
            {
              stack: [
                { text: [{ text: "Driver Name: ", bold: true }, String(lsData.driverName || "")] },
                { text: [{ text: "License No: ", bold: true }, String(lsData.licenseNo || "")] },
                { text: [{ text: "Mobile No: ", bold: true }, String(lsData.phone || "")] },
              ],
            },
            {
              stack: [
                { text: [{ text: "Agent's Name/Owner Name: ", bold: true }, String(lsData.vehicleOwner || "")] },
                { text: [{ text: "Address: ", bold: true }, String(lsData.vehicleOwnerAddress || "")] },
                { text: [{ text: "Contact No: ", bold: true }, String(lsData.vehicleOwnerPhone || "")] },
              ],
            },
          ],
        ],
      },
      layout: {
        hLineWidth: (i, node) => (i === node.table.body.length ? 0 : 0.6),
        vLineWidth: () => 0.6,
        hLineColor: () => "#000000",
        vLineColor: () => "#000000",
        paddingLeft: () => 3,
        paddingRight: () => 3,
        paddingTop: () => 2.5,
        paddingBottom: () => 2.5,
      },
      style: "driverInfoText",
    });

    // 5. LRs Table (9 columns, widths stretch to exactly 567.28 pt)
    const lrTableBody = [
      [
        { text: "Sr. No.", style: "tblHeader", alignment: "center" },
        { text: "LR No.", style: "tblHeader", alignment: "center" },
        { text: "InvoiceNo", style: "tblHeader", alignment: "center" },
        { text: "Destination", style: "tblHeader", alignment: "center" },
        { text: "Consignor", style: "tblHeader", alignment: "center" },
        { text: "Consignee", style: "tblHeader", alignment: "center" },
        { text: "Articles", style: "tblHeader", alignment: "center" },
        { text: "PMode", style: "tblHeader", alignment: "center" },
        { text: "Amount", style: "tblHeader", alignment: "center" },
      ],
    ];

    currentRows.forEach((row) => {
      lrTableBody.push([
        { text: String(row.srNo || ""), alignment: "center" },
        { text: String(row.lrNo || ""), alignment: "center" },
        { text: String(row.InvoiceNo || ""), alignment: "center" },
        { text: String(row.consigneeAddress || "") },
        { text: String(row.consignorNameMr || "") },
        { text: String(row.consigneeNameMr || "") },
        { text: String(row.articles || "0"), alignment: "right" },
        { text: String(row.payType || ""), alignment: "center" },
        { text: row.total !== null && row.total !== undefined ? String(row.total) : "-", alignment: "right" },
      ]);
    });

    // If last page, append the total row to the table
    if (isLastPage) {
      lrTableBody.push([
        { text: "Total", colSpan: 8, alignment: "right", bold: true, fontSize: 8.5 },
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        { text: String(lsData.total || lsData.totalPayable || "0.00"), alignment: "right", bold: true, fontSize: 8.5 },
      ]);
    }

    // Dynamic vertical padding:
    // Intermediate pages (!isLastPage): 4.8 pt vertical padding extends the 20 rows
    // down the page to remove excessive bottom whitespace.
    // Last page (isLastPage): calibrated based on rowCount so that 20 rows + bottom section fit on 1 page.
    const currentPad = isLastPage ? (rowCount <= 10 ? 3.5 : (rowCount <= 15 ? 2.8 : 2.2)) : 4.8;

    content.push({
      table: {
        widths: [22, 48, 62, 75, "*", "*", 32, 38, 65],
        body: lrTableBody,
      },
      layout: {
        hLineWidth: (i, node) => (isLastPage && i === node.table.body.length ? 0 : 0.5),
        vLineWidth: () => 0.5,
        hLineColor: () => "#000000",
        vLineColor: () => "#000000",
        paddingLeft: () => 2.5,
        paddingRight: () => 2.5,
        paddingTop: () => currentPad,
        paddingBottom: () => currentPad,
      },
      style: "lrRowText",
    });

    // 6. Last Page Bottom Section: Remarks, Terms, Checkboxes, Financial Breakdown, Signatures
    if (isLastPage) {
      // Remarks & Total Articles Row (Aligned with columns above)
      content.push({
        table: {
          widths: ["*", 100, 65],
          body: [
            [
              { text: [{ text: "Remark: ", bold: true }, String(lsData.remark || "")] },
              { text: "Total Articles:", bold: true, alignment: "right" },
              { text: String(lsData.totalArticles || "0"), bold: true, alignment: "right" },
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
          paddingTop: () => 2.5,
          paddingBottom: () => 2.5,
        },
        style: "driverInfoText",
      });

      // Terms + Financial Breakdown (Side-by-side)
      content.push({
        table: {
          widths: ["*", 155],
          body: [
            [
              // Left: Terms + Checkboxes
              {
                stack: [
                  { text: "1. The Truck was loaded in my presence.", fontSize: 7.2 },
                  {
                    text: "2. The article as per consignment detailed above are correct and they have been taken by me in any position.",
                    fontSize: 7.2,
                  },
                  { text: "3. Undertaken to abide by the rules and conditions printed overleaf.", fontSize: 7.2 },
                  // Checkboxes Row 1
                  {
                    columns: [
                      {
                        width: "auto",
                        columns: [
                          { image: uncheckedIcon, width: 8, height: 8, margin: [0, 0, 3, 0] },
                          { text: "L/D PHOTO", fontSize: 7.2, bold: true },
                        ],
                      },
                      {
                        width: "auto",
                        margin: [8, 0, 0, 0],
                        columns: [
                          { image: uncheckedIcon, width: 8, height: 8, margin: [0, 0, 3, 0] },
                          { text: "LP COPY", fontSize: 7.2, bold: true },
                        ],
                      },
                      {
                        width: "auto",
                        margin: [8, 0, 0, 0],
                        columns: [
                          { image: uncheckedIcon, width: 8, height: 8, margin: [0, 0, 3, 0] },
                          { text: "L COPY", fontSize: 7.2, bold: true },
                        ],
                      },
                      {
                        width: "auto",
                        margin: [8, 0, 0, 0],
                        columns: [
                          { image: uncheckedIcon, width: 8, height: 8, margin: [0, 0, 3, 0] },
                          { text: "RECHECK", fontSize: 7.2, bold: true },
                        ],
                      },
                    ],
                    margin: [0, 3, 0, 2],
                  },
                  // Service Tax Row
                  {
                    columns: [
                      { text: "Service Tax will be Paid by:", color: "#c00000", bold: true, fontSize: 7.2, width: "auto" },
                      {
                        width: "auto",
                        margin: [5, 0, 0, 0],
                        columns: [
                          { image: uncheckedIcon, width: 8, height: 8, margin: [0, 0, 2, 0] },
                          { text: "Consignee", fontSize: 7.2 },
                        ],
                      },
                      {
                        width: "auto",
                        margin: [5, 0, 0, 0],
                        columns: [
                          { image: uncheckedIcon, width: 8, height: 8, margin: [0, 0, 2, 0] },
                          { text: "Consignor", fontSize: 7.2 },
                        ],
                      },
                      {
                        width: "auto",
                        margin: [5, 0, 0, 0],
                        columns: [
                          { image: uncheckedIcon, width: 8, height: 8, margin: [0, 0, 2, 0] },
                          { text: "Transport", fontSize: 7.2 },
                        ],
                      },
                      {
                        width: "auto",
                        margin: [5, 0, 0, 0],
                        columns: [
                          { image: uncheckedIcon, width: 8, height: 8, margin: [0, 0, 2, 0] },
                          { text: "Exempted", fontSize: 7.2 },
                        ],
                      },
                    ],
                  },
                ],
              },
              // Right: Financial Summary Table
              {
                margin: [-3, -2, -3, -2],
                table: {
                  widths: ["*", 65],
                  body: [
                    [
                      { text: "Total Freight:", bold: true, fontSize: 7.5 },
                      { text: String(lsData.freight || "0.00"), alignment: "right", bold: true, fontSize: 7.5 },
                    ],
                    [
                      { text: "Advance:", fontSize: 7.2 },
                      { text: String(lsData.advance || "0.00"), alignment: "right", fontSize: 7.2 },
                    ],
                    [
                      { text: "Rent:", fontSize: 7.2 },
                      { text: String(lsData.rent || "0.00"), alignment: "right", fontSize: 7.2 },
                    ],
                    [
                      { text: "RTO:", fontSize: 7.2 },
                      { text: "0.00", alignment: "right", fontSize: 7.2 },
                    ],
                    [
                      { text: "Total Payable:", bold: true, fontSize: 8.2 },
                      { text: String(lsData.totalPayable || "0.00"), alignment: "right", bold: true, fontSize: 8.2 },
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
          paddingTop: () => 2.5,
          paddingBottom: () => 2.5,
        },
      });

      // Rupees in Words
      content.push({
        table: {
          widths: ["*"],
          body: [
            [
              {
                text: [{ text: "Rupees in words: ", bold: true }, String(lsData.payable || "")],
                fontSize: 7.8,
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
          paddingTop: () => 2.5,
          paddingBottom: () => 2.5,
        },
      });

      // Signatures
      content.push({
        table: {
          widths: ["33.3%", "33.3%", "33.4%"],
          body: [
            [
              {
                stack: [
                  { text: "", margin: [0, 20, 0, 0] },
                  { text: "Agent/V_Owner Signature", bold: true, alignment: "center", fontSize: 7.8 },
                ],
              },
              {
                stack: [
                  { text: "", margin: [0, 20, 0, 0] },
                  { text: "Driver Signature", bold: true, alignment: "center", fontSize: 7.8 },
                ],
              },
              {
                stack: [
                  { text: "", margin: [0, 20, 0, 0] },
                  { text: "Dispatch Signature", bold: true, alignment: "center", fontSize: 7.8 },
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
          paddingTop: () => 2.5,
          paddingBottom: () => 2.5,
        },
      });
    }

    // Page number bottom footer indicator
    content.push({
      text: `${pageNumber}/${totalPages}`,
      alignment: "right",
      fontSize: 8,
      margin: [0, 4, 0, 0],
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
      fontSize: 7.5,
      color: "#000000",
      lineHeight: 1.1,
    },
    styles: {
      mainTitle: {
        font: "Times",
        fontSize: 19,
        bold: true,
        color: "#c00000",
        alignment: "center",
      },
      subTitle: {
        font: "Times",
        fontSize: 14,
        bold: true,
        color: "#000000",
        alignment: "center",
      },
      addressText: {
        fontSize: 7.5,
        alignment: "center",
        lineHeight: 1.15,
      },
      metaText: {
        fontSize: 8.2,
      },
      driverInfoText: {
        fontSize: 7.5,
        lineHeight: 1.18,
      },
      tblHeader: {
        fontSize: 8,
        bold: true,
        fillColor: "#f0f0f0",
      },
      lrRowText: {
        fontSize: 7.5,
        lineHeight: 1.08,
      },
    },
    content,
  };
}

module.exports = { buildLoadingSlipDocDefinition };
