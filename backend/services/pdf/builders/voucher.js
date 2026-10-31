/**
 * Builds an in-memory pdfmake document definition for the Payment Collection Voucher.
 * @param {object} params
 * @param {object} params.info - Voucher view data object
 * @returns {object} pdfmake document definition
 */
function buildVoucherDocDefinition({ info }) {
  const content = [];

  // 1. Header Box Table
  content.push({
    table: {
      widths: ["75%", "25%"],
      body: [
        [
          {
            stack: [
              { text: "JAI SANTOSHI MAA TRANSPORT", style: "headerTitle" },
              {
                text: "Head Office: S. No. 48/1, New Uruli Devachi, Pune-Saswad Road, Phursungi, Tal. Haweli, Dist. Pune 412308.\nPh. Pune (020) 26989775, Baramati: (02112) 222836",
                style: "officeAddress",
              },
              {
                text: "Branch Office: Wagholi Gata No. 23/24, Plot No. 4, Priyanka nagari, Kank Godown, Nagar Road, Wagholi Dist. Pune, Ph.: 27050785 Mobile: 9822658775, 9850118975",
                style: "officeAddress",
                margin: [0, 2, 0, 0],
              },
            ],
            alignment: "center",
          },
          {
            stack: [
              { text: [{ text: "No.: ", bold: true }, String(info.voucherNumber || "")], margin: [0, 0, 0, 4] },
              { text: [{ text: "Date: ", bold: true }, String(info.date || "")] },
            ],
            alignment: "left",
            margin: [4, 4, 0, 0],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.6,
      vLineWidth: () => 0.6,
      hLineColor: () => "#000000",
      vLineColor: () => "#000000",
      paddingLeft: () => 4,
      paddingRight: () => 4,
      paddingTop: () => 3,
      paddingBottom: () => 3,
    },
    margin: [0, 0, 0, 4],
  });

  // 2. Receipt Details Table
  content.push({
    table: {
      widths: ["32%", "43%", "25%"],
      body: [
        [
          { text: "Received with thanks from M/s.", bold: true },
          { text: String(info.customer?.name || info.customer?.customer_name || "-"), colSpan: 2 },
          {},
        ],
        [
          { text: "the sum of Rupees", bold: true },
          { text: String(info.receive || "-"), colSpan: 2 },
          {},
        ],
        [
          { text: String(info.paymentMode || ""), bold: true },
          { text: String(info.chequeNo || "-") },
          { text: [{ text: "Date: ", bold: true }, String(info.paymentDate || "-")] },
        ],
        [
          { text: "Payment against Bill no.", bold: true },
          { text: String(info.billNo || "-") },
          { text: [{ text: "Date: ", bold: true }, String(info.billDate || "-")] },
        ],
        [
          { text: "Bank", bold: true },
          { text: String(info.bank || "-"), colSpan: 2 },
          {},
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.6,
      vLineWidth: () => 0.6,
      hLineColor: () => "#000000",
      vLineColor: () => "#000000",
      paddingLeft: () => 4,
      paddingRight: () => 4,
      paddingTop: () => 3,
      paddingBottom: () => 3,
    },
    style: "detailText",
    margin: [0, 0, 0, 4],
  });

  // 3. Amount & Sign-off Table
  content.push({
    table: {
      widths: ["60%", "40%"],
      body: [
        [
          {
            stack: [
              { text: `Rs. ${info.payment || "0.00"}`, style: "amountDigits" },
              info.note ? { text: info.note, style: "amountNote" } : { text: "" },
            ],
          },
          {
            stack: [
              { text: "", margin: [0, 20, 0, 0] },
              { text: "for JAI SANTOSHI MAA TRANSPORT", bold: true, alignment: "center", fontSize: 8 },
            ],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.6,
      vLineWidth: () => 0.6,
      hLineColor: () => "#000000",
      vLineColor: () => "#000000",
      paddingLeft: () => 4,
      paddingRight: () => 4,
      paddingTop: () => 4,
      paddingBottom: () => 4,
    },
    margin: [0, 0, 0, 6],
  });

  // 4. Created & Print Date
  content.push({
    columns: [
      info.createdDate ? { text: `Created Date: ${info.createdDate}`, fontSize: 7, alignment: "left" } : { text: "" },
      info.printDate ? { text: `Print Date: ${info.printDate}`, fontSize: 7, alignment: "right" } : { text: "" },
    ],
  });

  return {
    pageSize: "A4",
    pageOrientation: "portrait",
    pageMargins: [28, 25, 28, 25],
    defaultStyle: {
      font: "Roboto",
      fontSize: 8,
      color: "#000000",
      lineHeight: 1.15,
    },
    styles: {
      headerTitle: {
        font: "Times",
        fontSize: 14,
        bold: true,
        alignment: "center",
        margin: [0, 0, 0, 2],
      },
      officeAddress: {
        fontSize: 6.5,
        alignment: "center",
        lineHeight: 1.1,
      },
      detailText: {
        fontSize: 8,
      },
      amountDigits: {
        fontSize: 12,
        bold: true,
        margin: [0, 4, 0, 2],
      },
      amountNote: {
        fontSize: 7,
        italics: true,
      },
    },
    content,
  };
}

module.exports = { buildVoucherDocDefinition };
