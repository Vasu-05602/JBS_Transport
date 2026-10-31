const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Bank = new Schema({
  name: {
    type: String,
    required: true
  },
  branchName: {
    type: String
  },
  branchCode: {
    type: String
  },
  ifsc: {
    type: String,
    required: true,
    unique: true
  },
  micr: {
    type: String,
    unique: true
  },
  phone: {
    type: String
  },
  email: {
    type: String
  },
  address: {
    type: String
  },
  active: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    required: function () { return !this.updatedBy }
  },
  updatedBy: {
    type: String,
    required: function () { return !this.createdBy }
  }
}, {
  collection: 'bank',
  timestamps: true
})

module.exports = mongoose.model('Bank', Bank);
