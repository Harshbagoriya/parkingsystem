const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/mysql')

// ── Parking Session (for SQL-based analytics) ───────────────
const ParkingSession = sequelize.define('ParkingSession', {
  id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  bookingId:     { type: DataTypes.STRING(20), allowNull: false },
  vehicleNumber: { type: DataTypes.STRING(20), allowNull: false },
  slotId:        { type: DataTypes.STRING(10), allowNull: false },
  zone:          { type: DataTypes.STRING(50) },
  category:      { type: DataTypes.STRING(30) },
  userId:        { type: DataTypes.STRING(50) },
  entryTime:     { type: DataTypes.DATE },
  exitTime:      { type: DataTypes.DATE },
  durationMin:   { type: DataTypes.INTEGER },
  status:        { type: DataTypes.ENUM('active','completed','cancelled'), defaultValue: 'active' },
}, { tableName: 'parking_sessions', timestamps: true })

// ── Slot Log (audit trail) ───────────────────────────────────
const SlotLog = sequelize.define('SlotLog', {
  id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  slotId:    { type: DataTypes.STRING(10), allowNull: false },
  fromStatus:{ type: DataTypes.STRING(20) },
  toStatus:  { type: DataTypes.STRING(20) },
  changedBy: { type: DataTypes.STRING(50) },
  reason:    { type: DataTypes.STRING(100) },
}, { tableName: 'slot_logs', timestamps: true })

module.exports = { ParkingSession, SlotLog }
