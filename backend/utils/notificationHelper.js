const Notification = require('../models/Notification');

const createNotification = async ({ title, message, type, severity = 'info', recipientId, recipientRole, relatedId, relatedModel }) => {
  try {
    await Notification.create({ title, message, type, severity, recipientId, recipientRole, relatedId, relatedModel });
  } catch (err) {
    console.error('Notification creation error:', err.message);
  }
};

module.exports = { createNotification };
