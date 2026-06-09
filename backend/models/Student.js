const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rollNumber: { type: String, required: true, unique: true, trim: true },
    registrationNumber: { type: String, required: true, unique: true, trim: true },
    department: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1, max: 8 },
    section: { type: String, trim: true },
    batch: { type: String, trim: true },
    contactNumber: { type: String, trim: true },
    guardianName: { type: String, trim: true },
    guardianContact: { type: String, trim: true },
    address: { type: String, trim: true },
    profileImage: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', studentSchema);
