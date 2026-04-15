require('dotenv').config()
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const morgan = require('morgan')

const connectMongo = require('./config/mongo')
const { sequelize } = require('./config/mysql')

const authRoutes = require('./routes/auth')
const slotRoutes = require('./routes/slots')
const bookingRoutes = require('./routes/bookings')
const userRoutes = require('./routes/users')
const entryRoutes = require('./routes/entryExit')

// ── App setup ────────────────────────────────────────────────
const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000', credentials: true }
})

// ── Middleware ───────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000', credentials: true }))
app.use(express.json())
app.use(morgan('dev'))

// Attach io to req so controllers can emit events
app.use((req, _res, next) => { req.io = io; next() })

// ── API Routes ───────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/slots', slotRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/users', userRoutes)
app.use('/api/entry-exit', entryRoutes)

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }))

// ── Socket.io ────────────────────────────────────────────────
io.on('connection', socket => {
  console.log(`[WS] Client connected: ${socket.id}`)
  socket.on('disconnect', () => console.log(`[WS] Client disconnected: ${socket.id}`))
})

// ── Frontend is deployed separately on Vercel ─────────────────
// Static file serving removed — this server is a pure API server.

// ── Global error handler ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message)
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' })
})

// ── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000

async function start() {
  try {
    await connectMongo()
    // MySQL sync (non-destructive)
    try {
      await sequelize.sync({ alter: false })
      console.log('[MySQL] Synced')
    } catch (e) {
      console.warn('[MySQL] Skipped (not configured):', e.message)
    }
    server.listen(PORT, () => console.log(`[Server] Running on http://localhost:${PORT}`))
  } catch (e) {
    console.error('[Fatal]', e)
    process.exit(1)
  }
}

start()
