const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SuppliersBill = new Schema(
  {
    branch: {
      type: String,
      required: true,
    },
    supplier: {
      type: String,
      required: true,
    },
    supplierType: {
      type: String,
      required: true,
    },
    supplyContent: {
      type: String,
    },
    date: {
      type: String,
      required: true,
    },
    invoiceNo: {
      type: String,
      required: true,
    },
    invoiceDate: {
      type: String,
      required: true,
    },
    quantity: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    payments: [],
    active: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      required: function () {
        return !this.updatedBy;
      },
    },
    updatedBy: {
      type: String,
      required: function () {
        return !this.createdBy;
      },
    },
  },
  {
    collection: "suppliersBill",
    timestamps: true,
  }
);

module.exports = mongoose.model("SuppliersBill", SuppliersBill);
