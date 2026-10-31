const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Quotation = new Schema(
  {
    quotationNo: {
      type: Number,
      unique: true,
    },
    date: {
      type: String,
    },
    from: {
      type: String,
    },
    to: {
      type: String,
    },
    ratePer: {
      type: String,
    },
    otherField: {
      type: String,
    },
    field1: {
      type: String,
    },
    field2: {
      type: String,
    },
    field3: {
      type: String,
    },
    termsAndCond: {
      type: String,
    },
    ddChanger: {
      type: Number,
    },
    customer: {
      type: String,
    },
    customerId: {
      type: String,
    },
    customerCity: {
      type: String,
    },
    branch: {
      type: String,
    },
    stations: [],
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
    collection: "quotation",
    timestamps: true,
  }
);

module.exports = mongoose.model("Quotation", Quotation);
