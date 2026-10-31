const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Place = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    abbreviation: {
      type: String,
    },
    active: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      // required: function () { return !this.updatedBy }
    },
    updatedBy: {
      type: String,
      // required: function () { return !this.createdBy }
    },
  },
  {
    collection: "place",
    timestamps: true,
  }
);

module.exports = mongoose.model("Place", Place);
