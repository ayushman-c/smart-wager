const mongoose = require('mongoose');

const submissionQRSchema = new mongoose.Schema(
  {
    qrId: { type: String, required: true, unique: true },
    practicalNumber: { type: String, required: true },
    experimentName: { type: String, required: true, trim: true },
    subject: { type: String, trim: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    semester: { type: Number },
    section: { type: String, trim: true },
    department: { type: String, trim: true },
    deadline: { type: Date },
    qrCode: { type: String }, // base64 QR image
    qrData: { type: String }, // encoded data
    isActive: { type: Boolean, default: true },
    maxSubmissions: { type: Number },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SubmissionQR', submissionQRSchema);
