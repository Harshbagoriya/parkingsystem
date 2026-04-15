const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/slotsController')
const { protect, adminOnly } = require('../middleware/auth')

router.get('/',        protect, ctrl.getAllSlots)
router.get('/stats',   protect, ctrl.getStats)
router.post('/',       protect, adminOnly, ctrl.createSlots)
router.patch('/:slotId', protect, adminOnly, ctrl.updateSlotStatus)
router.delete('/:slotId', protect, adminOnly, ctrl.deleteSlot)

module.exports = router
