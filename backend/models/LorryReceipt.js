const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LorryReceipt = new Schema(
  {
    branch: {
      type: String,
      //required: true,
    },
    lrNo: {
      type: String,
      unique: true,
    },
    date: {
      type: String,
    },
    invoiceNo: {
      type: String,
    },
    eWayBillNo: {
      type: String,
    },
    vehicleNo: {
      type: String,
    },
    foNum: {
      type: String,
    },
    consignor: {
      type: String,
      //required: true,
    },
    consignorName: {
      type: String,
      //required: true,
    },
    consignorNameMr: {
      type: String,
    },
    consignorAddress: {
      type: String,
      //required: true,
    },
    consignorPhone: {
      type: String,
    },
    consignorEmail: {
      type: String,
    },
    consignee: {
      type: String,
      //required: true,
    },
    consigneeName: {
      type: String,
      //required: true,
    },
    consigneeNameMr: {
      type: String,
    },
    consigneeAddress: {
      type: String,
    },
    consigneePhone: {
      type: String,
    },
    consigneeEmail: {
      type: String,
    },
    from: {
      type: String,
      //required: true,
    },
    fromMr: {
      type: String,
    },
    to: {
      type: String,
      //required: true,
    },
    toMr: {
      type: String,
    },
    totalFreight: {
      type: Number,
      //required: true,
    },
    statisticalCharges: {
      type: Number,
      //required: true,
    },
    serviceTaxCharges: {
      type: Number,
      //required: true,
    },
    panNo: {
      type: String,
      //required: true,
    },
    hamali: {
      type: Number,
    },
    deliveryCharges: {
      type: Number,
    },
    lrCharges: {
      type: Number,
      //required: true,
    },
    weightCharges: {
      type: Number,
      //required: true,
    },
    oscCharges: {
      type: Number,
      //required: true,
    },
    collectionCharges: {
      type: Number,
      //required: true,
    },
    total: {
      type: Number,
      //required: true,
    },
    materialCost: {
      type: Number,
    },
    deliveryType: {
      type: String,
    },
    deliveryInDays: {
      type: Number,
    },
    serviceTaxBy: {
      type: String,
    },
    payType: {
      type: String,
    },
    toBilled: {
      type: String,
    },
    collectAt: {
      type: String,
    },
    payMode: {
      type: String,
    },
    bankName: {
      type: String,
    },
    chequeNo: {
      type: String,
    },
    memoNo: {
      type: String,
    },
    chequeDate: {
      type: String,
    },
    remark: {
      type: String,
    },
    status: {
      type: Number,
      default: 0,
      /*0 = new, 1 = loading slip generated, 2 = delivered*/
    },
    transactions: [
      {
        article: {
          type: String,
          //required: true,
        },
        articleNo: {
          type: Number,
          //required: true,
        },
        description: {
          type: String,
        },
        weight: {
          type: Number,
        },
        chargeWeight: {
          type: Number,
        },
        rateType: {
          type: String,
        },
        rate: {
          type: Number,
        },
        freight: {
          type: Number,
          //required: true,
        },
        foNum: {
          type: Number,
        },
      },
    ],
    deliveryDate: {
      type: String,
      default: null,
    },
    associatedLS: {
      type: String,
      default: "",
    },
    billGenerated: {
      type: Boolean,
      default: false,
    },
    assoBill: {
      type: String,
      default: "",
    },
    serviceType: {
      type: String,
    },
    ack: {
      type: String,
    },
    active: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      default: "System",
      // required: function () {
      //   return !this.updatedBy;
      // },
    },
    updatedBy: {
      type: String,
      default: "System",
      // required: function () {
      //   return !this.createdBy;
      // },
    },
  },
  {
    collection: "lorryReceipt",
    timestamps: true,
  }
);

// LorryReceipt.index({ vehicleNo: "text" });

module.exports = mongoose.model("LorryReceipt", LorryReceipt);
