const User = require('../models/User')

// GET /api/users — admin: list all users
exports.getAllUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query
    const filter = {}
    if (role)   filter.role   = role
    if (status) filter.status = status
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }
    const users = await User.find(filter).select('-password').sort('-createdAt')
    res.json({ users })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// DELETE /api/users/:id — admin: remove user
exports.removeUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ message: 'User removed' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PATCH /api/users/:id/suspend — admin: toggle suspend
exports.suspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    user.status = user.status === 'active' ? 'suspended' : 'active'
    await user.save()
    res.json({ user: user.toSafeObject() })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
