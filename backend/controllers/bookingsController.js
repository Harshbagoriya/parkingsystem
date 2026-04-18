const Booking     = require('../models/Booking')
const ParkingSlot = require('../models/ParkingSlot')

const CATEGORY_ZONE = {
  student_bike: 'Student Bike',
  student_car:  'Student Car',
  faculty:      'Faculty',
}

// POST /api/bookings — create new booking
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
      // Book the exact slot requested
      slot = await ParkingSlot.findOne({ slotId: preferredSlot.toUpperCase(), status: 'available' })
      if (!slot) return res.status(409).json({ message: `Slot ${preferredSlot} is not available` })
    } else {
      // Auto-assign: find first available slot in the correct zone for this category
      const zone = CATEGORY_ZONE[category]
      if (!zone) return res.status(400).json({ message: `Invalid category: ${category}. Use student_bike, student_car, or faculty` })
      slot = await ParkingSlot.findOne({ category, status: 'available' })
        || await ParkingSlot.findOne({ zone, status: 'available' })
      if (!slot) return res.status(409).json({ message: `No slots available in ${zone} zone` })
    }

    // Reserve the slot
    slot.status = 'reserved'
    await slot.save()

    // Create booking (expires in 45 min)
    const expiresAt = new Date(Date.now() + 45 * 60 * 1000)
    const booking = await Booking.create({
      user: req.user._id, slotId: slot.slotId,
      vehicleNumber: vehicleNumber.toUpperCase(), vehicleType, category,
      expiresAt, status: 'reserved',
    })

    slot.currentBooking = booking._id
    await slot.save()

    // Emit real-time event
    req.io.emit('slot:updated',  { slotId: slot.slotId, status: 'reserved' })
    req.io.emit('booking:new',   { bookingId: booking.bookingId })

    res.status(201).json({ booking })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/bookings/my — current user's bookings
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).sort('-createdAt').limit(50)
    res.json({ bookings })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/bookings/recent — admin: recent bookings
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

// GET /api/bookings — admin: all bookings with filter
exports.getAllBookings = async (req, res) => {
  try {
    const filter = {}
    if (req.query.status) filter.status = req.query.status
    const bookings = await Booking.find(filter)
      .sort('-createdAt').limit(100)
      .populate('user', 'name email')
    res.json({ bookings })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// DELETE /api/bookings/:id — cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Booking not found' })

    // Only owner or admin can cancel
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorised' })
    }
    if (!['reserved', 'active'].includes(booking.status)) {
      return res.status(400).json({ message: 'Cannot cancel a completed or already cancelled booking' })
    }

    booking.status = 'cancelled'
    await booking.save()

    // Free the slot
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

// POST /api/bookings/admin-reserve — admin reserves a slot for any person
exports.adminReserve = async (req, res) => {
  try {
    const {
      holderName, holderEmail, holderMobile, holderRole,
      vehicleNumber, vehicleType, category, preferredSlot, notes
    } = req.body

    if (!holderName || !vehicleNumber || !vehicleType || !category) {
      return res.status(400).json({ message: 'Name, vehicle number, vehicle type and category are required' })
    }

    // Find or resolve the user by email if provided
    let userId = req.user._id  // default: admin owns it
    if (holderEmail) {
      const User = require('../models/User')
      const found = await User.findOne({ email: holderEmail.toLowerCase() })
      if (found) userId = found._id
    }

    // Check if this vehicle already has an active booking
    const existing = await Booking.findOne({
      vehicleNumber: vehicleNumber.toUpperCase(),
      status: { $in: ['reserved', 'active'] }
    })
    if (existing) {
      return res.status(409).json({ message: `Vehicle ${vehicleNumber.toUpperCase()} already has an active booking (${existing.bookingId})` })
    }

    // Find the slot
    let slot
    if (preferredSlot) {
      slot = await ParkingSlot.findOne({ slotId: preferredSlot.toUpperCase(), status: 'available' })
      if (!slot) return res.status(409).json({ message: `Slot ${preferredSlot.toUpperCase()} is not available` })
    } else {
      const CATEGORY_ZONE = { student_bike: 'Student Bike', student_car: 'Student Car', faculty: 'Faculty' }
      const zone = CATEGORY_ZONE[category]
      if (!zone) return res.status(400).json({ message: `Invalid category: ${category}` })
      slot = await ParkingSlot.findOne({ category, status: 'available' })
              || await ParkingSlot.findOne({ zone, status: 'available' })
      if (!slot) return res.status(409).json({ message: `No slots available in ${zone} zone` })
    }

    // Reserve the slot
    slot.status = 'reserved'
    await slot.save()

    // Create booking — expires in 24h for admin reservations
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const booking = await Booking.create({
      user: userId,
      slotId: slot.slotId,
      vehicleNumber: vehicleNumber.toUpperCase(),
      vehicleType, category,
      expiresAt, status: 'reserved',
      isAdminReserved: true,
      holderName:   holderName.trim(),
      holderEmail:  holderEmail ? holderEmail.trim() : null,
      holderMobile: holderMobile ? holderMobile.trim() : null,
      holderRole:   holderRole || 'student',
      adminNotes:   notes ? notes.trim() : null,
    })

    slot.currentBooking = booking._id
    await slot.save()

    req.io.emit('slot:updated', { slotId: slot.slotId, status: 'reserved' })
    req.io.emit('booking:new', { bookingId: booking.bookingId })

    res.status(201).json({
      booking,
      holderName, holderEmail, holderMobile, holderRole,
      notes,
      message: `Slot ${slot.slotId} reserved for ${holderName}`
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/bookings/admin-reserve — admin get all admin-reserved bookings
exports.getAdminReservations = async (req, res) => {
  try {
    const filter = { isAdminReserved: true }
    if (req.query.status) filter.status = req.query.status
    const bookings = await Booking.find(filter)
      .sort('-createdAt').limit(200)
      .populate('user', 'name email mobile role')
    res.json({ bookings })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
