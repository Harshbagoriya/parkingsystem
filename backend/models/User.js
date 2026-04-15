const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const vehicleSchema = new mongoose.Schema({
  vehicleNumber: { type: String, required: true, uppercase: true, trim: true },
  vehicleType:   { type: String, enum: ['bike','scooter','car','suv'], required: true },
}, { _id: false })

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  mobile:   { type: String, trim: true },

  // ── password is optional for Google users ──
  password: { type: String, minlength: 6, select: false },

  // ── Google OAuth fields ──
  googleId:    { type: String, default: null },
  googlePhoto: { type: String, default: null },
  authProvider:{ type: String, enum: ['local', 'google'], default: 'local' },

  role:     { type: String, enum: ['student','faculty','admin'], default: 'student' },
  vehicles: [vehicleSchema],
  status:   { type: String, enum: ['active','suspended'], default: 'active' },
}, { timestamps: true })

// Hash password before save — skip if Google user (no password)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.comparePassword = function (candidate) {
  // Google users have no password — reject comparison
  if (!this.password) return Promise.resolve(false)
  return bcrypt.compare(candidate, this.password)
}

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject()
  delete obj.password
  return obj
}

module.exports = mongoose.model('User', userSchema)