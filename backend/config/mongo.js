const mongoose = require('mongoose')

module.exports = async function connectMongo() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/parksmart'
  try {
    await mongoose.connect(uri)
    console.log('[MongoDB] Connected:', uri)
  } catch (err) {
    console.error('[MongoDB] Connection failed:', err.message)
    throw err
  }
}
