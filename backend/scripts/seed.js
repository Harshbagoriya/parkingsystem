require('dotenv').config()
const mongoose    = require('mongoose')
const connectMongo = require('../config/mongo')
const User        = require('../models/User')
const ParkingSlot = require('../models/ParkingSlot')

const SLOTS = [
  // Student Bike Zone — A-01 to A-12
  ...Array.from({ length: 12 }, (_, i) => ({
    slotId:   `A-${String(i+1).padStart(2,'0')}`,
    zone:     'Student Bike',
    category: 'student_bike',
    status:   [2,6,8,10].includes(i+1) ? 'occupied' : [4,12].includes(i+1) ? 'reserved' : 'available',
  })),
  // Student Car Zone — B-01 to B-10
  ...Array.from({ length: 10 }, (_, i) => ({
    slotId:   `B-${String(i+1).padStart(2,'0')}`,
    zone:     'Student Car',
    category: 'student_car',
    status:   [1,4,6,8,9,10].includes(i+1) ? 'occupied' : [5].includes(i+1) ? 'reserved' : 'available',
  })),
  // Faculty Zone — C-01 to C-18
  ...Array.from({ length: 18 }, (_, i) => ({
    slotId:   `C-${String(i+1).padStart(2,'0')}`,
    zone:     'Faculty',
    category: 'faculty',
    status:   [1,3,5,8,11,14].includes(i+1) ? 'occupied' : [7].includes(i+1) ? 'reserved' : 'available',
  })),
]

const USERS = [
  { name: 'Admin User',    email: 'admin@parksmart.com',   password: 'admin123',   role: 'admin',   mobile: '+91 99999 00001' },
  { name: 'Rahul Sharma',  email: 'student@parksmart.com', password: 'student123', role: 'student', mobile: '+91 98765 43210' },
  { name: 'Prof. Verma',   email: 'faculty@parksmart.com', password: 'faculty123', role: 'faculty', mobile: '+91 87654 32100' },
]

async function seed() {
  await connectMongo()
  console.log('🌱 Seeding database...')

  // Clear existing
  await ParkingSlot.deleteMany({})
  await User.deleteMany({})

  // Insert slots
  await ParkingSlot.insertMany(SLOTS)
  console.log(`✅ ${SLOTS.length} parking slots created`)

  // Insert users (passwords hashed via pre-save hook)
  for (const u of USERS) {
    await User.create(u)
  }
  console.log(`✅ ${USERS.length} users created`)

  console.log('\n🔑 Demo credentials:')
  USERS.forEach(u => console.log(`   ${u.role.padEnd(8)} → ${u.email} / ${u.password}`))

  await mongoose.disconnect()
  console.log('\n✨ Seed complete!')
}

seed().catch(err => { console.error(err); process.exit(1) })
