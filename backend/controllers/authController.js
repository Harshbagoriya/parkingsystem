const jwt  = require('jsonwebtoken')
const User = require('../models/User')

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, mobile, password, role } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' })
    }
    const exists = await User.findOne({ email })
    if (exists) return res.status(409).json({ message: 'Email already registered' })

    const user  = await User.create({ name, email, mobile, password, role: role || 'student' })
    const token = signToken(user._id)
    res.status(201).json({ token, user: user.toSafeObject() })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' })

    const user = await User.findOne({ email }).select('+password')
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }
    if (user.status === 'suspended') return res.status(403).json({ message: 'Account suspended' })

    const token = signToken(user._id)
    res.json({ token, user: user.toSafeObject() })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ user: req.user })
}

// POST /api/auth/add-vehicle
exports.addVehicle = async (req, res) => {
  try {
    const { vehicleNumber, vehicleType } = req.body
    if (!vehicleNumber || !vehicleType) {
      return res.status(400).json({ message: 'Vehicle number and type required' })
    }
    req.user.vehicles.push({ vehicleNumber: vehicleNumber.toUpperCase(), vehicleType })
    await req.user.save()
    res.json({ user: req.user.toSafeObject() })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/auth/google
exports.googleLogin = async (req, res) => {
  try {
    const { access_token } = req.body
    if (!access_token) return res.status(400).json({ message: 'No token provided' })

    // Fetch user info from Google
    const googleRes = await fetch(
      `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${access_token}`
    )
    const profile = await googleRes.json()

    if (!profile.email) return res.status(401).json({ message: 'Google auth failed' })

    // Find existing user or create new one
    let user = await User.findOne({ email: profile.email })

    if (!user) {
      // New user via Google — auto-register as student
      user = await User.create({
        name:     profile.name,
        email:    profile.email,
        password: Math.random().toString(36) + 'Aa1!', // random password, not used
        role:     'student',
        googleId: profile.id,
      })
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Account suspended' })
    }

    const token = signToken(user._id)
    res.json({ token, user: user.toSafeObject() })

  } catch (err) {
    res.status(500).json({ message: 'Google login error: ' + err.message })
  }
}
