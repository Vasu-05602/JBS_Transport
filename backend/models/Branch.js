const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Branch = new Schema(
  {
    branchCode: {
      type: String,
      required: true,
    },
    abbreviation: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    place: {
      type: String,
      required: true,
    },
    printer: {
      type: String,
      // required: true,
    },
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
    collection: "branch",
    timestamps: true,
  }
);

module.exports = mongoose.model("Branch", Branch);
