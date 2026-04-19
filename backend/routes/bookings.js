const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/bookingsController')
const { protect, adminOnly } = require('../middleware/auth')

router.post('/',                      protect,            ctrl.createBooking)
router.get('/my',                     protect,            ctrl.getMyBookings)
router.get('/recent',                 protect,            ctrl.getRecentBookings)
router.post('/admin-reserve',         protect, adminOnly, ctrl.adminReserve)
router.get('/admin-reserve',          protect, adminOnly, ctrl.getAdminReservations)
router.get('/',                       protect, adminOnly, ctrl.getAllBookings)
router.post('/:id/approve-entry',     protect, adminOnly, ctrl.approveEntry)
router.post('/:id/approve-exit',      protect, adminOnly, ctrl.approveExit)
router.post('/:id/request-exit',      protect,            ctrl.requestExit)
router.delete('/:id',                 protect,            ctrl.cancelBooking)

module.exports = router
