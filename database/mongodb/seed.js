// Run with: mongosh parksmart < seed.js
// Or: node ../backend/scripts/seed.js

db = db.getSiblingDB('parksmart')

// ── Clear ────────────────────────────────────────────────────
db.parkingslots.drop()
db.users.drop()
db.bookings.drop()
db.entryexits.drop()

// ── Parking Slots ────────────────────────────────────────────
const slots = []

// Zone A — Student Bike (A-01 to A-12)
for (let i = 1; i <= 12; i++) {
  const id = 'A-' + String(i).padStart(2,'0')
  slots.push({
    slotId:   id,
    zone:     'Student Bike',
    category: 'student_bike',
    status:   [2,6,8,10].includes(i) ? 'occupied' : [4,12].includes(i) ? 'reserved' : 'available',
    currentVehicle: null,
    currentBooking: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}

// Zone B — Student Car (B-01 to B-10)
for (let i = 1; i <= 10; i++) {
  const id = 'B-' + String(i).padStart(2,'0')
  slots.push({
    slotId:   id,
    zone:     'Student Car',
    category: 'student_car',
    status:   [1,4,6,8,9,10].includes(i) ? 'occupied' : [5].includes(i) ? 'reserved' : 'available',
    currentVehicle: null,
    currentBooking: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}

// Zone C — Faculty (C-01 to C-18)
for (let i = 1; i <= 18; i++) {
  const id = 'C-' + String(i).padStart(2,'0')
  slots.push({
    slotId:   id,
    zone:     'Faculty',
    category: 'faculty',
    status:   [1,3,5,8,11,14].includes(i) ? 'occupied' : [7].includes(i) ? 'reserved' : 'available',
    currentVehicle: null,
    currentBooking: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}

db.parkingslots.insertMany(slots)
print('✅ ' + slots.length + ' parking slots inserted')
