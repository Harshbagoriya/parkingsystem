const mongoose = require('mongoose')

const entryExitSchema = new mongoose.Schema({
  vehicleNumber: { type: String, required: true, uppercase: true },
  slotId:        { type: String, required: true, uppercase: true },
  type:          { type: String, enum: ['entry', 'exit'], required: true },
  booking:       { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  recordedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  method:        { type: String, enum: ['manual', 'auto'], default: 'manual' },
}, { timestamps: true })

module.exports = mongoose.model('EntryExit', entryExitSchema)
