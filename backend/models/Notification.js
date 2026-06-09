const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['MissingEquipment', 'LateReturn', 'DamagedEquipment', 'PendingVerification', 'General', 'SystemAlert'],
      required: true,
    },
    severity: { type: String, enum: ['info', 'warning', 'error', 'success'], default: 'info' },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null = broadcast
    recipientRole: { type: String, enum: ['admin', 'teacher', 'student', 'all'] },
    isRead: { type: Boolean, default: false },
    relatedId: { type: mongoose.Schema.Types.ObjectId }, // related document ID
    relatedModel: { type: String }, // model name
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
