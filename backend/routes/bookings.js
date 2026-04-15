const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/bookingsController')
const { protect, adminOnly } = require('../middleware/auth')

router.post('/',         protect, ctrl.createBooking)
router.get('/my',        protect, ctrl.getMyBookings)
router.get('/recent',    protect, ctrl.getRecentBookings)
router.get('/',          protect, adminOnly, ctrl.getAllBookings)
router.delete('/:id',    protect, ctrl.cancelBooking)

module.exports = router
