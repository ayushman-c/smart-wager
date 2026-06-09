const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { getEquipment, getEquipmentById, addEquipment, updateEquipment, deleteEquipment, regenerateQR, scanEquipment } = require('../controllers/equipment.controller');
const { protect, authorize } = require('../middleware/auth');
const { uploadEquipment } = require('../utils/cloudinary');

router.use(protect);
router.post('/scan', authorize('admin', 'teacher'), asyncHandler(scanEquipment));
router.get('/', asyncHandler(getEquipment));
router.post('/', authorize('admin', 'teacher'), uploadEquipment.single('image'), asyncHandler(addEquipment));
router.get('/:id', asyncHandler(getEquipmentById));
router.put('/:id', authorize('admin', 'teacher'), uploadEquipment.single('image'), asyncHandler(updateEquipment));
router.delete('/:id', authorize('admin'), asyncHandler(deleteEquipment));
router.post('/:id/qr', authorize('admin', 'teacher'), asyncHandler(regenerateQR));

module.exports = router;
