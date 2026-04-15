const mongoose = require('mongoose')

const bookingSchema = new mongoose.Schema({
  bookingId:     { type: String, unique: true },
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  slotId:        { type: String, required: true, uppercase: true },
  vehicleNumber: { type: String, required: true, uppercase: true },
  vehicleType:   { type: String },
  category:      { type: String },
  status:        { type: String, enum: ['reserved','active','completed','cancelled'], default: 'reserved' },
  entryTime:     { type: Date, default: null },
  exitTime:      { type: Date, default: null },
  expiresAt:     { type: Date },
}, { timestamps: true })

// Auto-generate bookingId
bookingSchema.pre('save', async function (next) {
  if (!this.bookingId) {
    const count = await mongoose.model('Booking').countDocuments()
    this.bookingId = `BK${String(count + 1).padStart(4, '0')}`
  }
  next()
})

module.exports = mongoose.model('Booking', bookingSchema)
