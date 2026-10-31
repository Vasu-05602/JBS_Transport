const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Employee = new Schema(
  {
    code: {
      type: String,
      required: true,
      // unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    correspondenceAddress: {
      type: String,
    },
    permanentAddress: {
      type: String,
    },
    dateOfBirth: {
      type: String,
    },
    qualification: {
      type: String,
    },
    telephone: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
    },
    email: {
      type: String,
    },
    bloodGroup: {
      type: String,
    },
    joiningDate: {
      type: String,
    },
    designation: {
      type: String,
    },
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
    collection: "employee",
    timestamps: true,
  }
);

module.exports = mongoose.model("Employee", Employee);
