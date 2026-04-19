const Booking     = require('../models/Booking')
const ParkingSlot = require('../models/ParkingSlot')
const User        = require('../models/User')

const CATEGORY_ZONE = {
  student_bike: 'Student Bike',
  student_car:  'Student Car',
  faculty:      'Faculty',
}

// POST /api/bookings — create new booking (student/faculty self-booking)
exports.createBooking = async (req, res) => {
  try {
    const { vehicleNumber, vehicleType, category, preferredSlot } = req.body
    if (!vehicleNumber) return res.status(400).json({ message: 'Vehicle number is required' })

    // Check for active booking by this user
    const activeBooking = await Booking.findOne({ user: req.user._id, status: { $in: ['reserved','active'] } })
    if (activeBooking) {
      return res.status(409).json({ message: 'You already have an active booking' })
    }

    let slot
    if (preferredSlot) {
      slot = await ParkingSlot.findOne({ slotId: preferredSlot.toUpperCase(), status: 'available' })
      if (!slot) return res.status(409).json({ message: `Slot ${preferredSlot} is not available` })
    } else {
      const zone = CATEGORY_ZONE[category]
      if (!zone) return res.status(400).json({ message: `Invalid category: ${category}` })
      slot = await ParkingSlot.findOne({ category, status: 'available' })
          || await ParkingSlot.findOne({ zone, status: 'available' })
      if (!slot) return res.status(409).json({ message: `No slots available in ${zone} zone` })
    }

    slot.status = 'reserved'
    await slot.save()

    const expiresAt = new Date(Date.now() + 45 * 60 * 1000)
    const booking = await Booking.create({
      user: req.user._id,
      slotId: slot.slotId,
      vehicleNumber: vehicleNumber.toUpperCase(),
      vehicleType, category,
      expiresAt, status: 'reserved',
    })

    slot.currentBooking = booking._id
    await slot.save()

    req.io.emit('slot:updated', { slotId: slot.slotId, status: 'reserved' })
    req.io.emit('booking:new',  { bookingId: booking.bookingId })

    res.status(201).json({ booking })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/bookings/my
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).sort('-createdAt').limit(50)
    res.json({ bookings })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/bookings/recent — admin
exports.getRecentBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .sort('-createdAt').limit(20)
      .populate('user', 'name email')
    res.json({ bookings })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/bookings — admin: all bookings
exports.getAllBookings = async (req, res) => {
  try {
    const filter = {}
    if (req.query.status)        filter.status        = req.query.status
    if (req.query.vehicleNumber) filter.vehicleNumber = req.query.vehicleNumber.toUpperCase()
    const bookings = await Booking.find(filter)
      .sort('-createdAt').limit(100)
      .populate('user', 'name email')
    res.json({ bookings })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// DELETE /api/bookings/:id — cancel
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Booking not found' })

    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorised' })
    }
    if (!['reserved', 'active'].includes(booking.status)) {
      return res.status(400).json({ message: 'Cannot cancel a completed or already cancelled booking' })
    }

    booking.status = 'cancelled'
    await booking.save()

    await ParkingSlot.findOneAndUpdate(
      { slotId: booking.slotId },
      { status: 'available', currentBooking: null, currentVehicle: null }
    )

    req.io.emit('slot:updated', { slotId: booking.slotId, status: 'available' })
    res.json({ message: 'Booking cancelled', booking })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/bookings/admin-reserve — admin reserves for any person
exports.adminReserve = async (req, res) => {
  try {
    const {
      holderName, holderEmail, holderMobile, holderRole,
      vehicleNumber, vehicleType, category, preferredSlot, notes
    } = req.body

    // Validate required fields
    if (!holderName || !holderName.trim()) {
      return res.status(400).json({ message: 'Holder name is required' })
    }
    if (!vehicleNumber || !vehicleNumber.trim()) {
      return res.status(400).json({ message: 'Vehicle number is required' })
    }
    if (!vehicleType) {
      return res.status(400).json({ message: 'Vehicle type is required' })
    }
    if (!category || !CATEGORY_ZONE[category]) {
      return res.status(400).json({ message: 'Valid category is required (student_bike, student_car, faculty)' })
    }

    const vNum = vehicleNumber.toUpperCase().trim()

    // Check if vehicle already has active booking
    const existing = await Booking.findOne({
      vehicleNumber: vNum,
      status: { $in: ['reserved', 'active'] }
    })
    if (existing) {
      return res.status(409).json({
        message: `Vehicle ${vNum} already has an active booking (${existing.bookingId}). Cancel it first.`
      })
    }

    // Find the slot
    let slot
    if (preferredSlot && preferredSlot.trim()) {
      slot = await ParkingSlot.findOne({
        slotId: preferredSlot.toUpperCase().trim(),
        status: 'available'
      })
      if (!slot) {
        return res.status(409).json({
          message: `Slot ${preferredSlot.toUpperCase()} is not available. Choose a different slot.`
        })
      }
    } else {
      // Auto-assign from correct zone
      const zone = CATEGORY_ZONE[category]
      slot = await ParkingSlot.findOne({ category, status: 'available' })
          || await ParkingSlot.findOne({ zone,     status: 'available' })
      if (!slot) {
        return res.status(409).json({
          message: `No available slots in ${CATEGORY_ZONE[category]} zone`
        })
      }
    }

    // Find user account by email (optional linkage)
    let userId = req.user._id  // admin as fallback owner
    if (holderEmail && holderEmail.trim()) {
      const found = await User.findOne({ email: holderEmail.toLowerCase().trim() })
      if (found) userId = found._id
    }

    // Reserve slot
    slot.status = 'reserved'
    await slot.save()

    // Create booking — 24h expiry for admin reservations
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const booking = await Booking.create({
      user:            userId,
      slotId:          slot.slotId,
      vehicleNumber:   vNum,
      vehicleType,
      category,
      expiresAt,
      status:          'reserved',
      isAdminReserved: true,
      holderName:      holderName.trim(),
      holderEmail:     holderEmail ? holderEmail.trim() : null,
      holderMobile:    holderMobile ? holderMobile.trim() : null,
      holderRole:      holderRole || 'student',
      adminNotes:      notes ? notes.trim() : null,
    })

    slot.currentBooking = booking._id
    await slot.save()

    req.io.emit('slot:updated', { slotId: slot.slotId, status: 'reserved' })
    req.io.emit('booking:new',  { bookingId: booking.bookingId })

    res.status(201).json({
      booking,
      holderName:   holderName.trim(),
      holderEmail:  holderEmail || null,
      holderMobile: holderMobile || null,
      holderRole:   holderRole || 'student',
      notes:        notes || null,
      message:      `Slot ${slot.slotId} reserved for ${holderName.trim()}`
    })
  } catch (err) {
    console.error('[adminReserve error]', err)
    res.status(500).json({ message: err.message })
  }
}

// GET /api/bookings/admin-reserve — all bookings for admin panel
exports.getAdminReservations = async (req, res) => {
  try {
    const filter = {}
    if (req.query.status) filter.status = req.query.status
    const bookings = await Booking.find(filter)
      .sort('-createdAt')
      .limit(200)
      .populate('user', 'name email mobile role')
    res.json({ bookings })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/bookings/:id/approve-entry — admin clicks "Approve Entry"
// Marks booking active, slot occupied, logs entry
exports.approveEntry = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Booking not found' })
    if (booking.status !== 'reserved') {
      return res.status(400).json({ message: `Cannot approve entry — booking is ${booking.status}` })
    }

    const EntryExit = require('../models/EntryExit')

    // Activate booking
    booking.status    = 'active'
    booking.entryTime = new Date()
    await booking.save()

    // Mark slot occupied
    await ParkingSlot.findOneAndUpdate(
      { slotId: booking.slotId },
      { status: 'occupied', currentVehicle: booking.vehicleNumber, currentBooking: booking._id }
    )

    // Log the entry event
    await EntryExit.create({
      vehicleNumber: booking.vehicleNumber,
      slotId:        booking.slotId,
      type:          'entry',
      booking:       booking._id,
      recordedBy:    req.user._id,
      method:        'auto',
    })

    req.io.emit('slot:updated', { slotId: booking.slotId, status: 'occupied' })

    res.json({ message: `Entry approved — ${booking.vehicleNumber} is now parked at ${booking.slotId}`, booking })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/bookings/:id/approve-exit — admin clicks "Approve Exit"
// Marks booking completed, slot available, logs exit
exports.approveExit = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Booking not found' })
    if (booking.status !== 'active') {
      return res.status(400).json({ message: `Cannot approve exit — booking is ${booking.status}` })
    }

    const EntryExit = require('../models/EntryExit')

    const exitTime   = new Date()
    const durationMin = booking.entryTime
      ? Math.round((exitTime - booking.entryTime) / 60000)
      : null

    booking.status   = 'completed'
    booking.exitTime = exitTime
    await booking.save()

    // Free the slot
    await ParkingSlot.findOneAndUpdate(
      { slotId: booking.slotId },
      { status: 'available', currentVehicle: null, currentBooking: null }
    )

    // Log the exit event
    await EntryExit.create({
      vehicleNumber: booking.vehicleNumber,
      slotId:        booking.slotId,
      type:          'exit',
      booking:       booking._id,
      recordedBy:    req.user._id,
      method:        'auto',
    })

    req.io.emit('slot:updated', { slotId: booking.slotId, status: 'available' })

    res.json({
      message: `Exit approved — ${booking.slotId} is now free. Duration: ${durationMin ?? '?'} min`,
      booking, durationMin
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
