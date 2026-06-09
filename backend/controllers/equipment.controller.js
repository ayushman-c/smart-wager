const Equipment = require('../models/Equipment');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { createAuditLog } = require('../utils/auditHelper');

// @desc  Get all equipment
// @route GET /api/equipment
// @access All authenticated
const getEquipment = async (req, res) => {
  const { search, category, status, labSection, page = 1, limit = 20 } = req.query;
  const query = {};
  if (category) query.category = category;
  if (status) query.status = status;
  if (labSection) query.labSection = { $regex: labSection, $options: 'i' };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { equipmentId: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  const total = await Equipment.countDocuments(query);
  const equipment = await Equipment.find(query)
    .populate('addedBy', 'name')
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });
  res.json({ success: true, count: equipment.length, total, page: Number(page), equipment });
};

// @desc  Get single equipment
// @route GET /api/equipment/:id
// @access All authenticated
const getEquipmentById = async (req, res) => {
  const equipment = await Equipment.findById(req.params.id).populate('addedBy', 'name email');
  if (!equipment) return res.status(404).json({ success: false, message: 'Equipment not found' });
  res.json({ success: true, equipment });
};

// @desc  Add equipment
// @route POST /api/equipment
// @access Admin, Teacher
const addEquipment = async (req, res) => {
  const { name, category, description, labSection, quantity, location, purchaseDate, warrantyExpiry, manufacturer, modelNumber, notes } = req.body;
  const equipmentId = `EQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const qrData = JSON.stringify({ type: 'equipment', equipmentId, id: null }); // id updated after save

  const equipment = await Equipment.create({
    equipmentId, name, category, description, labSection,
    quantity: Number(quantity), availableQuantity: Number(quantity),
    location, purchaseDate, warrantyExpiry, manufacturer, modelNumber, notes,
    addedBy: req.user._id,
    image: req.file ? req.file.path : undefined,
  });

  // Generate QR code after we have the _id
  const qrPayload = JSON.stringify({ type: 'equipment', equipmentId: equipment.equipmentId, _id: equipment._id.toString() });
  const qrCodeBase64 = await QRCode.toDataURL(qrPayload, { errorCorrectionLevel: 'H', width: 300 });

  equipment.qrCode = qrCodeBase64;
  equipment.qrData = qrPayload;
  await equipment.save();

  await createAuditLog({ userId: req.user._id, userName: req.user.name, userRole: req.user.role, action: 'EquipmentAdded', description: `Added equipment: ${name}`, ipAddress: req.ip, relatedId: equipment._id, relatedModel: 'Equipment' });
  res.status(201).json({ success: true, equipment });
};

// @desc  Update equipment
// @route PUT /api/equipment/:id
// @access Admin, Teacher
const updateEquipment = async (req, res) => {
  const { name, category, description, labSection, quantity, status, location, manufacturer, modelNumber, notes } = req.body;
  const equipment = await Equipment.findById(req.params.id);
  if (!equipment) return res.status(404).json({ success: false, message: 'Equipment not found' });

  const oldQty = equipment.quantity;
  const diff = Number(quantity || oldQty) - oldQty;

  const updated = await Equipment.findByIdAndUpdate(
    req.params.id,
    {
      name, category, description, labSection, status, location, manufacturer, modelNumber, notes,
      quantity: quantity || equipment.quantity,
      availableQuantity: equipment.availableQuantity + diff,
      ...(req.file && { image: req.file.path }),
    },
    { new: true, runValidators: true }
  );

  await createAuditLog({ userId: req.user._id, userName: req.user.name, userRole: req.user.role, action: 'EquipmentEdited', description: `Updated equipment: ${name || equipment.name}`, ipAddress: req.ip, relatedId: equipment._id, relatedModel: 'Equipment' });
  res.json({ success: true, equipment: updated });
};

// @desc  Delete equipment
// @route DELETE /api/equipment/:id
// @access Admin
const deleteEquipment = async (req, res) => {
  const equipment = await Equipment.findByIdAndDelete(req.params.id);
  if (!equipment) return res.status(404).json({ success: false, message: 'Equipment not found' });
  await createAuditLog({ userId: req.user._id, userName: req.user.name, userRole: req.user.role, action: 'EquipmentDeleted', description: `Deleted equipment: ${equipment.name}`, ipAddress: req.ip });
  res.json({ success: true, message: 'Equipment deleted' });
};

// @desc  Regenerate QR for equipment
// @route POST /api/equipment/:id/qr
// @access Admin, Teacher
const regenerateQR = async (req, res) => {
  const equipment = await Equipment.findById(req.params.id);
  if (!equipment) return res.status(404).json({ success: false, message: 'Equipment not found' });
  const qrPayload = JSON.stringify({ type: 'equipment', equipmentId: equipment.equipmentId, _id: equipment._id.toString() });
  const qrCodeBase64 = await QRCode.toDataURL(qrPayload, { errorCorrectionLevel: 'H', width: 300 });
  equipment.qrCode = qrCodeBase64;
  equipment.qrData = qrPayload;
  await equipment.save();
  await createAuditLog({ userId: req.user._id, userName: req.user.name, userRole: req.user.role, action: 'QRGenerated', description: `Regenerated QR for: ${equipment.name}`, ipAddress: req.ip });
  res.json({ success: true, qrCode: qrCodeBase64, qrData: qrPayload });
};

// @desc  Lookup equipment by QR data
// @route POST /api/equipment/scan
// @access Admin, Teacher
const scanEquipment = async (req, res) => {
  const { qrData } = req.body;
  let parsed;
  try {
    parsed = JSON.parse(qrData);
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid QR data' });
  }
  const equipment = await Equipment.findOne({ equipmentId: parsed.equipmentId }).populate('addedBy', 'name');
  if (!equipment) return res.status(404).json({ success: false, message: 'Equipment not found from QR' });
  res.json({ success: true, equipment });
};

module.exports = { getEquipment, getEquipmentById, addEquipment, updateEquipment, deleteEquipment, regenerateQR, scanEquipment };
