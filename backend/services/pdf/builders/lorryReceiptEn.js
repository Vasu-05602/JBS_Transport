const { buildLorryReceiptDocDefinition } = require("./lorryReceipt");

/**
 * Builds an in-memory document definition for Lorry Receipt (English / Legacy flow)
 * Compatible with generateLrPdf parameters.
 */
async function buildLorryReceiptEnDocDefinition(params) {
  const lrData = {
    ...params.data,
    lrNo: params.data.lrNo || params.data.lr_number || params.data.LRNo,
    consignorName: params.data.consignorName || params.data.consigner,
    consignorPhone: params.data.consignorPhone || params.data.consigner_telephone,
    consigneeName: params.data.consigneeName || params.data.consignee,
    consigneePhone: params.data.consigneePhone || params.data.toplacecontact,
    from: params.data.from || params.data.loc_from,
    to: params.data.to || params.data.loc_to,
    invoiceNo: params.data.invoiceNo || params.data.InvoiceNo,
    eWayBillNo: params.data.eWayBillNo || params.data.EwayNo,
    totalFreight: params.data.totalFreight || params.data.freight,
    deliveryCharges: params.data.deliveryCharges || params.data.delivery,
    lrCharges: params.data.lrCharges || params.data.statatical,
    hamali: params.data.hamali,
    total: params.data.total,
    isPaid: params.data.pay_type === "Paid" || params.data.isPaid,
    isToPay: params.data.pay_type === "ToPay" || params.data.isToPay,
    isTBB: params.data.pay_type === "TBB" || params.data.isTBB,
    transactions: params.data.transactions || [],
  };

  return await buildLorryReceiptDocDefinition({
    lr: lrData,
    printDate: params.printDate || new Date().toLocaleDateString("en-GB"),
    user: params.user || params.data.user || "",
  });
}

module.exports = { buildLorryReceiptEnDocDefinition };
