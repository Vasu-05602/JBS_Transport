const assets = require("../assets");

/**
 * Builds an in-memory pdfmake document definition for the Rate Quotation letterhead.
 * @param {object} params
 * @param {object} params.quotation - Quotation data object
 * @param {string} params.date - Formatted date string
 * @param {string} params.fromDate - Formatted validity start date
 * @param {string} params.toDate - Formatted validity end date
 * @param {Array} params.stations1 - Station pricing rows
 * @param {string} [params.companyName]
 * @param {string} [params.companyTagline]
 * @param {string} [params.companyAddress]
 * @param {string} [params.companyMobile]
 * @param {string} [params.companyEmail]
 * @param {string} [params.companyGST]
 * @param {string} [params.createdDate]
 * @param {string} [params.printDate]
 * @returns {object} pdfmake document definition
 */
function buildQuotationDocDefinition({
  quotation,
  date,
  fromDate,
  toDate,
  stations1,
  companyName = "J.B.S. TRANSPUNE",
  companyTagline = "Jai Jagannath",
  companyAddress = "Jadhav Warehouse, Gat no.2324, Priyanka Nagari, opp. Datta Temple, Pune-Nagar Road, Wagholi, Tal. Haveli, Dist. Pune-412207",
  companyMobile = "8055424121 / 9325247465",
  companyEmail = "jbstranspune@gmail.com / purusotamdalai@gmail.com",
  companyGST = "",
  createdDate,
  printDate,
}) {
  const content = [];

  // 1. Letterhead Table (Left logo, Center text, Right deity logo)
  content.push({
    table: {
      widths: [60, "*", 60],
      body: [
        [
          {
            image: assets.jsb,
            fit: [55, 45],
            alignment: "center",
            border: [false, false, false, false],
          },
          {
            stack: [
              { text: companyTagline, style: "tagline" },
              { text: companyName, style: "mainCompanyTitle" },
              { text: companyAddress, style: "addressLine" },
              {
                text: `Mob. No. ${companyMobile}${companyEmail ? `, Email: ${companyEmail}` : ""}`,
                style: "addressLine",
              },
            ],
            border: [false, false, false, false],
          },
          {
            image: assets.jsb,
            fit: [55, 45],
            alignment: "center",
            border: [false, false, false, false],
          },
        ],
      ],
    },
    layout: "noBorders",
    margin: [0, 0, 0, 10],
  });

  // 2. Date
  content.push({
    text: date || "",
    alignment: "right",
    fontSize: 9,
    margin: [0, 0, 0, 8],
  });

  // 3. To Block
  const toStack = [
    { text: "To,", fontSize: 9 },
    { text: String(quotation.customer || ""), fontSize: 9, bold: true, margin: [0, 2, 0, 0] },
  ];
  const city = String(quotation.customerCity || quotation.customer_city || "").trim();
  const address = String(quotation.customerAddress || "").trim();
  const addressLine = address
    ? city && !address.toLowerCase().includes(city.toLowerCase())
      ? `${address}, ${city}`
      : address
    : city;
  if (addressLine) {
    toStack.push({ text: addressLine, fontSize: 8.5 });
  }

  content.push({
    stack: toStack,
    margin: [0, 0, 0, 10],
  });

  // 4. Subject Heading
  content.push({
    text: "QUOTATION FOR TRANSPORTATION OF YOUR VALUED GOODS",
    fontSize: 10,
    bold: true,
    decoration: "underline",
    alignment: "center",
    margin: [0, 0, 0, 8],
  });

  // 5. Salutation & Intro
  content.push({
    text: "Dear Sir,",
    fontSize: 9,
    margin: [0, 0, 0, 5],
  });

  content.push({
    text: [
      "We submit here below our competitive quotation for the transportation of your valued goods, applicable from ",
      { text: String(fromDate || ""), bold: true },
      " to ",
      { text: String(toDate || ""), bold: true },
      ".",
    ],
    fontSize: 9,
    margin: [0, 0, 0, 10],
  });

  // 6. Stations Table (Dynamic columns based on custom fields)
  const hasOther = !!quotation.otherField;
  const hasF1 = !!quotation.field1;
  const hasF2 = !!quotation.field2;
  const hasF3 = !!quotation.field3;

  const headerRow = [
    { text: "Sr.No.", bold: true, alignment: "center", fontSize: 8.5 },
    { text: "Destination", bold: true, alignment: "center", fontSize: 8.5 },
    { text: `Rate Per ${quotation.ratePer || ""}`, bold: true, alignment: "center", fontSize: 8.5 },
  ];

  if (hasOther) headerRow.push({ text: String(quotation.otherField), bold: true, alignment: "center", fontSize: 8.5 });
  if (hasF1) headerRow.push({ text: String(quotation.field1), bold: true, alignment: "center", fontSize: 8.5 });
  if (hasF2) headerRow.push({ text: String(quotation.field2), bold: true, alignment: "center", fontSize: 8.5 });
  if (hasF3) headerRow.push({ text: String(quotation.field3), bold: true, alignment: "center", fontSize: 8.5 });

  const numCols = headerRow.length;
  const numExtra = Math.max(0, numCols - 3);

  // Available printable width on A4 portrait with 28pt margins: 595.28 - (28 * 2) = 539.28 pt.
  // Balanced widths prevent right-edge clipping across any combination of 3 to 7 columns.
  const srNoWidth = 28;
  const rateWidth = numExtra >= 3 ? 78 : numExtra === 2 ? 84 : 90;
  const extraWidth = numExtra === 4 ? 64 : numExtra === 3 ? 68 : numExtra === 2 ? 75 : 80;

  const widths = [srNoWidth, "*", rateWidth];
  for (let c = 3; c < numCols; c++) {
    widths.push(extraWidth);
  }

  const tableBody = [headerRow];

  (stations1 || []).forEach((st) => {
    const destinationName =
      (st.station && String(st.station).trim() !== "" && String(st.station).trim() !== "-")
        ? String(st.station).trim()
        : (st.stationName && String(st.stationName).trim() !== "" && String(st.stationName).trim() !== "-")
        ? String(st.stationName).trim()
        : (st.destination && String(st.destination).trim() !== "" && String(st.destination).trim() !== "-")
        ? String(st.destination).trim()
        : (st.place && String(st.place).trim() !== "" && String(st.place).trim() !== "-")
        ? String(st.place).trim()
        : "-";

    const dataRow = [
      { text: String(st.srNo || ""), alignment: "center", fontSize: 8 },
      { text: destinationName, alignment: "center", fontSize: 8 },
      { text: `Rs.${st.amount || ""} per ${quotation.ratePer || ""}`, alignment: "center", fontSize: 8 },
    ];
    if (hasOther) dataRow.push({ text: String(st.otherFieldValue || "-"), alignment: "center", fontSize: 8 });
    if (hasF1) dataRow.push({ text: String(st.field1 || "-"), alignment: "center", fontSize: 8 });
    if (hasF2) dataRow.push({ text: String(st.field2 || "-"), alignment: "center", fontSize: 8 });
    if (hasF3) dataRow.push({ text: String(st.field3 || "-"), alignment: "center", fontSize: 8 });
    tableBody.push(dataRow);
  });

  content.push({
    table: {
      widths,
      body: tableBody,
    },
    layout: {
      hLineWidth: () => 0.6,
      vLineWidth: () => 0.6,
      hLineColor: () => "#000000",
      vLineColor: () => "#000000",
      paddingLeft: () => 3,
      paddingRight: () => 3,
      paddingTop: () => 2.5,
      paddingBottom: () => 2.5,
    },
    margin: [0, 0, 0, 10],
  });

  // 7. Terms & Conditions Section (Dynamic, removes hardcoded charges)
  const rawTerms = quotation.termsAndCond || quotation.terms_and_cond || "";
  const parsedTerms = parseQuotationTerms(rawTerms);

  if (parsedTerms.length > 0) {
    content.push({
      text: "TERMS & CONDITIONS",
      bold: true,
      fontSize: 9,
      decoration: "underline",
      margin: [0, 4, 0, 3],
    });

    parsedTerms.forEach((term) => {
      content.push({
        text: term,
        fontSize: 8.5,
        margin: [6, 1, 0, 2],
      });
    });
  }

  // 8. Closing & Sign-off
  content.push({
    text: "Hope, you will give us an opportunity to serve you.",
    fontSize: 9,
    margin: [0, 6, 0, 3],
  });

  content.push({
    text: "We Remain, Very truly yours.",
    fontSize: 9,
    margin: [0, 0, 0, 6],
  });

  if (companyGST) {
    content.push({
      text: `Our Transportation ID (GST No): ${companyGST}`,
      bold: true,
      fontSize: 8.5,
      margin: [0, 0, 0, 12],
    });
  }

  content.push({
    stack: [
      { text: companyName, bold: true, fontSize: 9.5, alignment: "right" },
      { text: "", margin: [0, 24, 0, 0] },
      { text: "Authorised Signature", bold: true, fontSize: 9, alignment: "right" },
    ],
    margin: [0, 10, 0, 15],
  });

  // 9. Created and Print Dates Footer
  content.push({
    columns: [
      createdDate ? { text: `Created Date: ${createdDate}`, fontSize: 7, alignment: "left" } : { text: "" },
      printDate ? { text: `Print Date: ${printDate}`, fontSize: 7, alignment: "right" } : { text: "" },
    ],
  });

  return {
    pageSize: "A4",
    pageOrientation: "portrait",
    pageMargins: [28, 25, 28, 25],
    defaultStyle: {
      font: "Times",
      fontSize: 9,
      color: "#000000",
      lineHeight: 1.15,
    },
    styles: {
      tagline: {
        fontSize: 9,
        bold: true,
        alignment: "center",
      },
      mainCompanyTitle: {
        fontSize: 18,
        bold: true,
        color: "#c00000",
        alignment: "center",
        margin: [0, 1, 0, 2],
      },
      addressLine: {
        fontSize: 7.5,
        alignment: "center",
        lineHeight: 1.1,
      },
    },
    content,
  };
}

/**
 * Normalizes and formats quotation terms and conditions into clean numbered items.
 * Supports multi-line strings, bullet points, and inline numbering.
 * @param {string} rawTerms
 * @returns {string[]}
 */
function parseQuotationTerms(rawTerms) {
  if (!rawTerms || typeof rawTerms !== "string" || !rawTerms.trim()) {
    return [];
  }

  const lines = rawTerms
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const terms = [];
  for (const line of lines) {
    const parts = line.split(/(?=(?:^|\s)(?:\d+[\.\)]\s+))/).map((s) => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      terms.push(...parts);
    } else {
      terms.push(line);
    }
  }

  return terms.map((term, index) => {
    const numberedMatch = term.match(/^(?:\(?\d+\)?[\.\)]?|\d+[-–])\s*(.*)$/);
    if (numberedMatch && numberedMatch[1]) {
      const numMatch = term.match(/^(\d+)/);
      const num = numMatch ? numMatch[1] : index + 1;
      return `${num}) ${numberedMatch[1].trim()}`;
    }
    return `${index + 1}) ${term}`;
  });
}

module.exports = { buildQuotationDocDefinition, parseQuotationTerms };
