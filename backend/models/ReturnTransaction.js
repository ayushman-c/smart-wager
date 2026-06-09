const mongoose = require('mongoose');

const returnTransactionSchema = new mongoose.Schema(
  {
    issueTransactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'IssueTransaction', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    equipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    returnDate: { type: Date, required: true, default: Date.now },
    condition: {
      type: String,
      enum: ['Good', 'Damaged', 'Missing Parts', 'Needs Maintenance'],
      required: true,
    },
    remarks: { type: String, trim: true },
    isOverdue: { type: Boolean, default: false },
    overdueDays: { type: Number, default: 0 },
    quantity: { type: Number, default: 1, min: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReturnTransaction', returnTransactionSchema);
