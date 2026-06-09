const QRCode = require('qrcode');
const Equipment = require('../models/Equipment');
const SubmissionQR = require('../models/SubmissionQR');

// @desc  Decode/lookup any QR data
// @route POST /api/qr/decode
// @access Private
const decodeQR = async (req, res) => {
  const { qrData } = req.body;
  if (!qrData) return res.status(400).json({ success: false, message: 'qrData is required' });

  let parsed;
  try {
    parsed = JSON.parse(qrData);
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid QR data format' });
  }

  if (parsed.type === 'equipment') {
    const equipment = await Equipment.findOne({ equipmentId: parsed.equipmentId });
    if (!equipment) return res.status(404).json({ success: false, message: 'Equipment not found' });
    return res.json({ success: true, type: 'equipment', data: equipment });
  }

  if (parsed.type === 'submission') {
    const qr = await SubmissionQR.findOne({ qrId: parsed.qrId }).populate('teacherId', 'name');
    if (!qr) return res.status(404).json({ success: false, message: 'Submission QR not found' });
    return res.json({ success: true, type: 'submission', data: qr });
  }

  return res.status(400).json({ success: false, message: 'Unknown QR type' });
};

// @desc  Generate arbitrary QR for testing
// @route POST /api/qr/generate
// @access Admin, Teacher
const generateQR = async (req, res) => {
  const { data } = req.body;
  if (!data) return res.status(400).json({ success: false, message: 'data is required' });
  const qr = await QRCode.toDataURL(data, { errorCorrectionLevel: 'H', width: 300 });
  res.json({ success: true, qrCode: qr });
};

module.exports = { decodeQR, generateQR };
