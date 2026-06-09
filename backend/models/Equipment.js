const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema(
  {
    equipmentId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['Hand Tools', 'Measuring Instruments', 'Power Tools', 'Safety Equipment', 'Testing Equipment', 'CNC/Machine Tools', 'Other'],
    },
    description: { type: String, trim: true },
    labSection: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    availableQuantity: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['Available', 'Issued', 'Missing', 'Damaged', 'Maintenance'],
      default: 'Available',
    },
    qrCode: { type: String }, // base64 or URL of QR image
    qrData: { type: String }, // actual data encoded in QR
    location: { type: String, trim: true },
    purchaseDate: { type: Date },
    warrantyExpiry: { type: Date },
    manufacturer: { type: String, trim: true },
    modelNumber: { type: String, trim: true },
    image: { type: String },
    notes: { type: String, trim: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

equipmentSchema.index({ name: 'text', category: 'text', equipmentId: 'text' });

module.exports = mongoose.model('Equipment', equipmentSchema);
