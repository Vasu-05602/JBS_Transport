const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TransactionPrefix = new Schema(
  {
    name: {
      type: String,
      index: true,
      unique: true,
      required: true,
    },
    prefix: {
      type: String,
      unique: true,
      required: true,
    },
    current: {
      type: Number,
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
    collection: "transactionPrefix",
    timestamps: true,
  }
);

TransactionPrefix.index({ name: "text" });

module.exports = mongoose.model("TransactionPrefix", TransactionPrefix);
