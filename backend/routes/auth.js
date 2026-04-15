// ── routes/auth.js ───────────────────────────────────────────
const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/authController')
const { protect } = require('../middleware/auth')

router.post('/register',    ctrl.register)
router.post('/login',       ctrl.login)
router.get('/me',           protect, ctrl.getMe)
router.post('/add-vehicle', protect, ctrl.addVehicle)
router.post('/google', ctrl.googleLogin)

module.exports = router
