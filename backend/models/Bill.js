const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Bill = new Schema(
  {
    branch: {
      type: String,
      //required: true,
    },
    billNo: {
      type: Number,
      unique: true,
      //required: true,
    },
    date: {
      type: String,
      //required: true,
    },
    from: {
      type: String,
    },
    to: {
      type: String,
    },
    customer: {
      type: String,
      //required: true,
    },
    lrList: [
      {
        lrNo: String,
      },
    ],
    totalFreight: {
      type: Number,
      default: 0,
    },
    freight: {
      type: Number,
      default: 0,
    },
    localFreight: {
      type: Number,
      default: 0,
    },
    cgst: {
      type: Number,
      default: 0,
    },
    cgstPercent: {
      type: Number,
      default: 0,
    },
    sgst: {
      type: Number,
      default: 0,
    },
    sgstPercent: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      //required: true,
      default: 0,
      //totalFreight + freight + localFreight - discount
    },
    grandTotal: {
      type: Number,
      //required: true,
      default: 0,
      //totalFreight + freight + localFreight + cgst + sgst - discount
    },
    remark: {
      type: String,
    },
    paymentCollection: [
      {
        receivingDate: {
          type: String,
          //required: true,
        },
        receive: {
          type: Number,
          //required: true,
        },
        payMode: {
          type: String,
          //required: true,
        },
        bankName: {
          type: String,
        },
        chequeNo: {
          type: String,
        },
        chequeDate: {
          type: String,
        },
        jsmBank: {
          type: String,
        },
        jsmAccountNo: {
          type: String,
        },
        transactionNo: {
          type: String,
        },
        remark: {
          type: String,
        },
        createdBy: {
          type: String,
          //required: true,
        },
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      default: "System",
      required: function () {
        return !this.updatedBy;
      },
    },
    updatedBy: {
      type: String,
      default: "System",
      required: function () {
        return !this.createdBy;
      },
    },
  },
  {
    collection: "bill",
    timestamps: true,
  }
);

module.exports = mongoose.model("Bill", Bill);
