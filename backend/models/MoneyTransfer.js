const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MoneyTransfer = new Schema({
  pettyCashNo: {
    type: Number,
    unique: true
  },
  branch: {
    type: String,
    required: true
  },
  transferToBranch: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  remark: {
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
  collection: 'moneyTransfer',
  timestamps: true
});

MoneyTransfer.index({ transferToBranch: 'text' });

module.exports = mongoose.model('MoneyTransfer', MoneyTransfer);

// to increment the LR no.
// check https://www.npmjs.com/package/mongoose-auto-increment