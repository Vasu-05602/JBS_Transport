const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RateMaster = new Schema(
  {
    customer: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      unique: true,
    },
    rates: [
      {
        article: {
          type: String,
          require: true,
        },
        station: {
          type: String,
          // require: true,
        },
        stationName: {
          type: String,
          // require: true,
        },
        rate: {
          type: Number,
          require: true,
        },
        ddCharges: {
          type: Number,
        },
      },
    ],
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
    collection: "rateMaster",
    timestamps: true,
  }
);

module.exports = mongoose.model("RateMaster", RateMaster);
