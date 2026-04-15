const mongoose = require('mongoose')

const slotSchema = new mongoose.Schema({
  slotId:   { type: String, required: true, unique: true, uppercase: true, trim: true }, // e.g. "A-01"
  zone:     { type: String, required: true },          // "Student Bike" | "Student Car" | "Faculty"
  category: { type: String, required: true },          // "student_bike" | "student_car" | "faculty"
  status:   { type: String, enum: ['available','occupied','reserved'], default: 'available' },
  currentVehicle: { type: String, default: null },
  currentBooking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
}, { timestamps: true })

module.exports = mongoose.model('ParkingSlot', slotSchema)
