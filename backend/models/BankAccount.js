const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BankAccount = new Schema({
  bank: {
    type: String,
    required: true
  },
  ifsc: {
    type: String,
    required: true
  },
  accountType: {
    type: String
  },
  accountHolder: {
    type: String
  },
  customerId: {
    type: String
  },
  accountNo: {
    type: String,
    required: true
  },
  openingBalance: {
    type: Number
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
  collection: 'bankAccount',
  timestamps: true
})

module.exports = mongoose.model('BankAccount', BankAccount);
