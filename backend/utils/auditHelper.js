const AuditLog = require('../models/AuditLog');

const createAuditLog = async ({ userId, userName, userRole, action, description, ipAddress, userAgent, relatedId, relatedModel, metadata }) => {
  try {
    await AuditLog.create({
      userId,
      userName,
      userRole,
      action,
      description,
      ipAddress,
      userAgent,
      relatedId,
      relatedModel,
      metadata,
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

module.exports = { createAuditLog };
