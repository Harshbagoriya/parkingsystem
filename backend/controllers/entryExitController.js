const EntryExit   = require('../models/EntryExit')
const Booking     = require('../models/Booking')
const ParkingSlot = require('../models/ParkingSlot')
const { ParkingSession } = require('../models/MySQLModels')

// POST /api/entry-exit/entry
exports.recordEntry = async (req, res) => {
  try {
    const { vehicleNumber, slotId, method = 'manual' } = req.body
    if (!vehicleNumber) return res.status(400).json({ message: 'Vehicle number required' })

    // Find active reservation for this vehicle
    let booking = await Booking.findOne({
      vehicleNumber: vehicleNumber.toUpperCase(),
      status: 'reserved',
    })

    let resolvedSlotId = slotId
    if (booking) {
      resolvedSlotId = booking.slotId
      booking.status    = 'active'
      booking.entryTime = new Date()
      await booking.save()
    }

    if (!resolvedSlotId) {
      return res.status(400).json({ message: 'Slot ID required (no reservation found)' })
    }

    // Update slot to occupied
    const slot = await ParkingSlot.findOneAndUpdate(
      { slotId: resolvedSlotId.toUpperCase() },
      { status: 'occupied', currentVehicle: vehicleNumber.toUpperCase() },
      { new: true }
    )

    // Log entry event
    const record = await EntryExit.create({
      vehicleNumber: vehicleNumber.toUpperCase(),
      slotId: resolvedSlotId.toUpperCase(),
      type: 'entry',
      booking: booking?._id || null,
      recordedBy: req.user._id,
      method,
    })

    // Mirror to MySQL for analytics
    try {
      await ParkingSession.create({
        bookingId:     booking?.bookingId || 'WALK-IN',
        vehicleNumber: vehicleNumber.toUpperCase(),
        slotId:        resolvedSlotId.toUpperCase(),
        zone:          slot?.zone,
        category:      slot?.category,
        userId:        req.user._id.toString(),
        entryTime:     new Date(),
        status:        'active',
      })
    } catch (_) { /* MySQL optional */ }

    req.io.emit('slot:updated', { slotId: resolvedSlotId, status: 'occupied' })
    res.json({ record, slotId: resolvedSlotId })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/entry-exit/exit
exports.recordExit = async (req, res) => {
  try {
    const { vehicleNumber, method = 'manual' } = req.body
    if (!vehicleNumber) return res.status(400).json({ message: 'Vehicle number required' })

    // Find active booking
    const booking = await Booking.findOne({
      vehicleNumber: vehicleNumber.toUpperCase(),
      status: 'active',
    })

    // Also try to find via slot directly (handles walk-ins or booking-less entries)
    const slotByVehicle = await ParkingSlot.findOne({ currentVehicle: vehicleNumber.toUpperCase() })

    const slotId = booking?.slotId || slotByVehicle?.slotId
    if (!slotId) {
      return res.status(404).json({ message: 'No active session found for this vehicle' })
    }

    const exitTime = new Date()
    let durationMin = null

    if (booking) {
      durationMin = Math.round((exitTime - booking.entryTime) / 60000)
      booking.status   = 'completed'
      booking.exitTime = exitTime
      await booking.save()
    }

    // Free the slot
    const resolvedSlotId = slotId
    await ParkingSlot.findOneAndUpdate(
      { slotId: resolvedSlotId },
      { status: 'available', currentVehicle: null, currentBooking: null }
    )

    // Log exit
    const record = await EntryExit.create({
      vehicleNumber: vehicleNumber.toUpperCase(),
      slotId: resolvedSlotId || 'UNKNOWN',
      type: 'exit',
      booking: booking?._id || null,
      recordedBy: req.user._id,
      method,
    })

    // Update MySQL session
    try {
      await ParkingSession.update(
        { exitTime, durationMin, status: 'completed' },
        { where: { vehicleNumber: vehicleNumber.toUpperCase(), status: 'active' } }
      )
    } catch (_) { /* MySQL optional */ }

    req.io.emit('slot:updated', { slotId: resolvedSlotId, status: 'available' })
    res.json({ record, durationMin, slotId: resolvedSlotId })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/entry-exit/log — admin: today's log
exports.getLog = async (req, res) => {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0)
    const logs  = await EntryExit.find({ createdAt: { $gte: start } })
      .sort('-createdAt').limit(100)
    res.json({ logs })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
