const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String },
    userRole: { type: String },
    action: {
      type: String,
      enum: [
        'Login', 'Logout',
        'EquipmentAdded', 'EquipmentEdited', 'EquipmentDeleted',
        'EquipmentIssued', 'EquipmentReturned',
        'StudentAdded', 'StudentEdited', 'StudentDeleted',
        'SubmissionUploaded', 'SubmissionApproved', 'SubmissionRejected',
        'QRGenerated', 'UserCreated', 'UserDeleted',
        'ReportGenerated', 'Other',
      ],
      required: true,
    },
    description: { type: String, trim: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    relatedId: { type: mongoose.Schema.Types.ObjectId },
    relatedModel: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
