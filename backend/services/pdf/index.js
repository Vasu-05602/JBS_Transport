const pdfmake = require("pdfmake");
const { initPdfFonts } = require("./fonts");
const { tableLayouts } = require("./styles");

const { buildLorryReceiptDocDefinition } = require("./builders/lorryReceipt");
const { buildLoadingSlipDocDefinition } = require("./builders/loadingSlip");
const { buildBillDocDefinition, paginateBillTransactions } = require("./builders/bill");
const { buildQuotationDocDefinition } = require("./builders/quotation");
const { buildVoucherDocDefinition } = require("./builders/voucher");
const { buildLorryReceiptEnDocDefinition } = require("./builders/lorryReceiptEn");

// Initialize fonts and table layouts once at startup
initPdfFonts();
pdfmake.setTableLayouts(tableLayouts);

/**
 * Generates an in-memory PDF Buffer from a pdfmake document definition.
 * ZERO disk writes.
 * @param {object} docDefinition
 * @returns {Promise<Buffer>}
 */
async function generatePdfBuffer(docDefinition) {
  const doc = pdfmake.createPdf(docDefinition);
  return await doc.getBuffer();
}

/**
 * Generates an in-memory PDF Base64 string from a pdfmake document definition.
 * ZERO disk writes.
 * @param {object} docDefinition
 * @returns {Promise<string>}
 */
async function generatePdfBase64(docDefinition) {
  const doc = pdfmake.createPdf(docDefinition);
  return await doc.getBase64();
}

module.exports = {
  generatePdfBuffer,
  generatePdfBase64,
  buildLorryReceiptDocDefinition,
  buildLoadingSlipDocDefinition,
  buildBillDocDefinition,
  paginateBillTransactions,
  buildQuotationDocDefinition,
  buildVoucherDocDefinition,
  buildLorryReceiptEnDocDefinition,
};
