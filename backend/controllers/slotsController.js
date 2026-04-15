const ParkingSlot = require('../models/ParkingSlot')

// GET /api/slots — list all slots (with optional zone filter)
exports.getAllSlots = async (req, res) => {
  try {
    const filter = {}
    if (req.query.zone)     filter.zone     = req.query.zone
    if (req.query.status)   filter.status   = req.query.status
    if (req.query.category) filter.category = req.query.category

    const slots = await ParkingSlot.find(filter).sort('slotId')
    res.json({ slots })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/slots/stats
exports.getStats = async (req, res) => {
  try {
    const all      = await ParkingSlot.find()
    const total     = all.length
    const available = all.filter(s => s.status === 'available').length
    const occupied  = all.filter(s => s.status === 'occupied').length
    const reserved  = all.filter(s => s.status === 'reserved').length

    // Per-zone breakdown
    const zoneMap = {}
    all.forEach(s => {
      if (!zoneMap[s.zone]) zoneMap[s.zone] = { name: s.zone, total: 0, available: 0 }
      zoneMap[s.zone].total++
      if (s.status === 'available') zoneMap[s.zone].available++
    })

    res.json({ total, available, occupied, reserved, zones: Object.values(zoneMap) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PATCH /api/slots/:slotId — admin update status
exports.updateSlotStatus = async (req, res) => {
  try {
    const { status } = req.body
    const allowed = ['available', 'occupied', 'reserved']
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' })
    }
    const slot = await ParkingSlot.findOneAndUpdate(
      { slotId: req.params.slotId.toUpperCase() },
      { status },
      { new: true }
    )
    if (!slot) return res.status(404).json({ message: 'Slot not found' })

    // Emit real-time update
    req.io.emit('slot:updated', { slotId: slot.slotId, status })
    res.json({ slot })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/slots — admin add slot(s)
exports.createSlots = async (req, res) => {
  try {
    const { zone, category, prefix, count } = req.body
    const created = []
    for (let i = 1; i <= count; i++) {
      const slotId = `${prefix}-${String(i).padStart(2, '0')}`
      const exists = await ParkingSlot.findOne({ slotId })
      if (!exists) {
        const slot = await ParkingSlot.create({ slotId, zone, category })
        created.push(slot)
      }
    }
    res.status(201).json({ created: created.length, slots: created })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// DELETE /api/slots/:slotId — admin remove slot
exports.deleteSlot = async (req, res) => {
  try {
    const slot = await ParkingSlot.findOneAndDelete({ slotId: req.params.slotId.toUpperCase() })
    if (!slot) return res.status(404).json({ message: 'Slot not found' })
    res.json({ message: 'Slot removed', slotId: slot.slotId })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
