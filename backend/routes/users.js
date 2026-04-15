const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/usersController')
const { protect, adminOnly } = require('../middleware/auth')

router.get('/',              protect, adminOnly, ctrl.getAllUsers)
router.delete('/:id',        protect, adminOnly, ctrl.removeUser)
router.patch('/:id/suspend', protect, adminOnly, ctrl.suspendUser)

module.exports = router
