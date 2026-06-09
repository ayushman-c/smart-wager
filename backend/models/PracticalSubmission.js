const mongoose = require('mongoose');

const practicalSubmissionSchema = new mongoose.Schema(
  {
    submissionQRId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubmissionQR', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    practicalNumber: { type: String, required: true },
    experimentName: { type: String, required: true, trim: true },
    subject: { type: String, trim: true },
    submittedAt: { type: Date, default: Date.now },
    images: [{ type: String }], // Cloudinary URLs
    pdfReport: { type: String }, // Cloudinary URL
    remarks: { type: String, trim: true },
    verificationStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    teacherFeedback: { type: String, trim: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    marks: { type: Number },
    isLate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PracticalSubmission', practicalSubmissionSchema);
