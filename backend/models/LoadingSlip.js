const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LoadingSlip = new Schema(
  {
    branch: {
      type: String,
      //required: true,
    },
    lsNo: {
      type: Number,
      unique: true,
    },
    date: {
      type: String,
      //required: true,
    },
    vehicleNo: {
      type: String,
      //required: true,
    },
    vehicleOwner: {
      type: String,
      //required: true,
    },
    vehicleOwnerAddress: {
      type: String,
      //required: true,
    },
    vehicleOwnerPhone: {
      type: String,
    },
    driverName: {
      type: String,
      //required: true,
    },
    driver: {
      type: String,
      //required: true,
    },
    licenseNo: {
      type: String,
      //required: true,
    },
    phone: {
      type: String,
      //required: true,
    },
    from: {
      type: String,
      //required: true,
    },
    fromName: {
      type: String,
    },
    to: {
      type: String,
      //required: true,
    },
    toName: {
      type: String,
    },
    lrList: [
      {
        lrNo: String,
      },
    ],
    totalFreight: {
      type: Number,
      //required: true,
    },
    rent: {
      type: Number,
      //required: true,
    },
    advance: {
      type: Number,
      //required: true,
    },
    totalPayable: {
      type: Number,
      //required: true,
    },
    totalWeight: {
      type: Number,
    },
    currentTime: {
      type: String,
    },
    reachTime: {
      type: String,
    },
    paybleAt: {
      type: String,
    },
    remark: {
      type: String,
    },
    status: {
      type: Number,
      default: 0,
      /*0 = un-assigned, 1 = assigned*/
    },
    isLocalMemo: {
      type: Boolean,
      default: false,
    },
    supplierPayments: [],
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
    collection: "loadingSlip",
    timestamps: true,
  }
);

LoadingSlip.index({ vehicleNo: "text" });

module.exports = mongoose.model("LoadingSlip", LoadingSlip);

// to increment the LR no.
// check https://www.npmjs.com/package/mongoose-auto-increment
