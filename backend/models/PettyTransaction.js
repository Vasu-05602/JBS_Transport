const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PettyTransaction = new Schema({
  transactionNo: {
    type: Number,
    unique: true
  },
  transactionType: {
    type: String
  }, // driver / customer
  transactionName: {
    type: String
  }, // driver name / customer name
  type: {
    type: String,
    required: true
  },// debit / credit
  branch: {
    type: String,
    required: true
  },
  lsNo: {
    type: String
  },
  amount: {
    type: Number,
    required: true
  },
  availableBal: {
    type: Number,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  bank: {
    type: String
  },
  bankAccountNumber: {
    type: String
  },
  description: {
    type: String,
    required: true
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
  collection: 'pettyTransaction',
  timestamps: true
});

PettyTransaction.index({ transferToBranch: 'text' });

module.exports = mongoose.model('PettyTransaction', PettyTransaction);