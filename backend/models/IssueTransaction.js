const mongoose = require('mongoose');

const issueTransactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    equipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    issueDate: { type: Date, required: true, default: Date.now },
    expectedReturnDate: { type: Date },
    status: {
      type: String,
      enum: ['Issued', 'Returned', 'Overdue', 'Lost'],
      default: 'Issued',
    },
    notes: { type: String, trim: true },
    quantity: { type: Number, default: 1, min: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('IssueTransaction', issueTransactionSchema);
