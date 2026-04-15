// ── routes/entryExit.js ──────────────────────────────────────
const express  = require('express')
const router   = express.Router()
const ctrl     = require('../controllers/entryExitController')
const { protect, adminOnly, staffOnly } = require('../middleware/auth')

router.post('/entry',  protect, staffOnly, ctrl.recordEntry)
router.post('/exit',   protect, staffOnly, ctrl.recordExit)
router.get('/log',     protect, staffOnly, ctrl.getLog)

module.exports = router
