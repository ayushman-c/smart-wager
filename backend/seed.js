/**
 * Seed script - creates default admin, teacher, and student accounts
 * Run: node seed.js
 */
require('dotenv').config()
const mongoose = require('mongoose')
const User = require('./models/User')
const Student = require('./models/Student')
const Equipment = require('./models/Equipment')
const QRCode = require('qrcode')

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to MongoDB')

    // Clear existing data
    await User.deleteMany({})
    await Student.deleteMany({})
    await Equipment.deleteMany({})

    // Create admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@lab.edu',
      password: 'admin123',
      role: 'admin',
      department: 'Administration',
    })
    console.log('✅ Admin created: admin@lab.edu / admin123')

    // Create teacher
    await User.create({
      name: 'Dr. Ramesh Kumar',
      email: 'teacher@lab.edu',
      password: 'teacher123',
      role: 'teacher',
      department: 'Mechanical Engineering',
    })
    console.log('✅ Teacher created: teacher@lab.edu / teacher123')

    // ── Students ────────────────────────────────────────────────────────────
    const studentsData = [
      {
        name: 'Ayush Sharma',
        email: 'student@lab.edu',
        password: 'student123',
        rollNumber: 'ME2021001',
        registrationNumber: '20211001',
        semester: 5,
        section: 'A',
        batch: '2021-25',
        contactNumber: '9876543210',
      },
      {
        name: 'Priya Verma',
        email: 'priya.verma@lab.edu',
        password: 'priya@123',
        rollNumber: 'ME2021002',
        registrationNumber: '20211002',
        semester: 5,
        section: 'A',
        batch: '2021-25',
        contactNumber: '9876543211',
      },
      {
        name: 'Rohan Mehta',
        email: 'rohan.mehta@lab.edu',
        password: 'rohan@123',
        rollNumber: 'ME2021003',
        registrationNumber: '20211003',
        semester: 5,
        section: 'B',
        batch: '2021-25',
        contactNumber: '9876543212',
      },
      {
        name: 'Sneha Patel',
        email: 'sneha.patel@lab.edu',
        password: 'sneha@123',
        rollNumber: 'ME2021004',
        registrationNumber: '20211004',
        semester: 5,
        section: 'B',
        batch: '2021-25',
        contactNumber: '9876543213',
      },
      {
        name: 'Karan Singh',
        email: 'karan.singh@lab.edu',
        password: 'karan@123',
        rollNumber: 'ME2021005',
        registrationNumber: '20211005',
        semester: 5,
        section: 'A',
        batch: '2021-25',
        contactNumber: '9876543214',
      },
      {
        name: 'Ananya Joshi',
        email: 'ananya.joshi@lab.edu',
        password: 'ananya@123',
        rollNumber: 'ME2021006',
        registrationNumber: '20211006',
        semester: 5,
        section: 'B',
        batch: '2021-25',
        contactNumber: '9876543215',
      },
    ]

    for (const s of studentsData) {
      const userDoc = await User.create({
        name: s.name,
        email: s.email,
        password: s.password,
        role: 'student',
        department: 'Mechanical Engineering',
        contactNumber: s.contactNumber,
      })
      await Student.create({
        userId: userDoc._id,
        rollNumber: s.rollNumber,
        registrationNumber: s.registrationNumber,
        department: 'Mechanical Engineering',
        semester: s.semester,
        section: s.section,
        batch: s.batch,
        contactNumber: s.contactNumber,
      })
      console.log(`✅ Student created: ${s.email} / ${s.password}`)
    }

    // ── Equipment ────────────────────────────────────────────────────────────
    const equipmentData = [
      { name: 'Vernier Caliper', category: 'Measuring Instruments', description: 'Digital Vernier caliper 0-150mm', labSection: 'ME-Lab-1', quantity: 10 },
      { name: 'Micrometer Screw Gauge', category: 'Measuring Instruments', description: '0-25mm range', labSection: 'ME-Lab-1', quantity: 5 },
      { name: 'Hammer', category: 'Hand Tools', description: 'Ball peen hammer 500g', labSection: 'ME-Lab-2', quantity: 8 },
      { name: 'Hacksaw', category: 'Hand Tools', description: 'Adjustable frame hacksaw', labSection: 'ME-Lab-2', quantity: 6 },
      { name: 'Drill Machine', category: 'Power Tools', description: '13mm chuck drill machine', labSection: 'ME-Lab-3', quantity: 3 },
      { name: 'Safety Goggles', category: 'Safety Equipment', description: 'Impact-resistant safety goggles', labSection: 'ME-Lab-1', quantity: 20 },
      { name: 'Lathe Machine (Mini)', category: 'CNC/Machine Tools', description: 'Mini bench lathe for demonstrations', labSection: 'ME-Lab-4', quantity: 2 },
      { name: 'Try Square', category: 'Measuring Instruments', description: '150mm engineer try square', labSection: 'ME-Lab-2', quantity: 12 },
    ]

    for (const eq of equipmentData) {
      const equipmentId = `EQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      const created = await Equipment.create({
        ...eq, equipmentId,
        availableQuantity: eq.quantity,
        addedBy: admin._id,
      })
      const qrPayload = JSON.stringify({ type: 'equipment', equipmentId: created.equipmentId, _id: created._id.toString() })
      const qrCode = await QRCode.toDataURL(qrPayload, { errorCorrectionLevel: 'H', width: 300 })
      created.qrCode = qrCode
      created.qrData = qrPayload
      await created.save()
    }
    console.log(`✅ ${equipmentData.length} equipment items created with QR codes`)

    console.log('\n🎉 Database seeded successfully!')
    process.exit(0)
  } catch (err) {
    console.error('❌ Seed failed:', err.message)
    process.exit(1)
  }
}

seed()
