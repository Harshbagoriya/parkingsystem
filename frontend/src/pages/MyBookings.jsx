import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import styles from './MyBookings.module.css'

const STATUS_STYLES = {
  reserved:       { label: 'Reserved',        bg: 'var(--amber-glow)',          color: 'var(--amber)' },
  active:         { label: 'Parked ✓',        bg: 'var(--green-glow)',           color: 'var(--green)' },
  exit_requested: { label: 'Exit Requested',  bg: 'rgba(61,158,255,0.12)',       color: 'var(--accent)' },
  completed:      { label: 'Completed',        bg: 'rgba(255,255,255,0.04)',      color: 'var(--text-muted)' },
  cancelled:      { label: 'Cancelled',        bg: 'var(--red-glow)',             color: 'var(--red)' },
}

// Status-based messaging shown to user
const STATUS_MSG = {
  reserved:       { icon: '⏳', text: 'Awaiting admin entry approval. Please proceed to your slot.' },
  active:         { icon: '🚗', text: 'Your vehicle is parked. Click "Request Exit" when you are ready to leave.' },
  exit_requested: { icon: '🔔', text: 'Exit request sent. Please wait at the gate — admin will approve shortly.' },
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')
  const [actionLoading, setActionLoading] = useState({})

  const fetchBookings = () => {
    api.get('/bookings/my')
      .then(r => setBookings(r.data.bookings || []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchBookings()
    // Poll every 15s so status updates (admin approvals) reflect automatically
    const interval = setInterval(fetchBookings, 15000)
    return () => clearInterval(interval)
  }, [])

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this reservation?')) return
    setActionLoading(p => ({ ...p, [id]: 'cancel' }))
    try {
      await api.delete(`/bookings/${id}`)
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'cancelled' } : b))
      toast.success('Booking cancelled')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel')
    } finally {
      setActionLoading(p => ({ ...p, [id]: null }))
    }
  }

  const handleRequestExit = async (id) => {
    setActionLoading(p => ({ ...p, [id]: 'exit' }))
    try {
      await api.post(`/bookings/${id}/request-exit`)
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'exit_requested' } : b))
      toast.success('🔔 Exit request sent! Admin will approve your exit shortly.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request exit')
    } finally {
      setActionLoading(p => ({ ...p, [id]: null }))
    }
  }

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Bookings</h1>
          <p className={styles.subtitle}>History of all your parking reservations</p>
        </div>
        <div className={styles.filterRow}>
          {['all','active','reserved','exit_requested','completed','cancelled'].map(f => (
            <button key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
              onClick={() => setFilter(f)}>
              {f === 'exit_requested' ? 'Exit Req.' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 110, borderRadius: 14 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🅿</div>
          <h3>No bookings found</h3>
          <p>Book your first parking slot to see it here.</p>
        </div>
      ) : (
        <div className={styles.bookingList}>
          {filtered.map(b => {
            const st = STATUS_STYLES[b.status] || STATUS_STYLES.completed
            const msg = STATUS_MSG[b.status]
            const isActioning = actionLoading[b._id]

            const duration = b.entryTime && b.exitTime
              ? Math.round((new Date(b.exitTime) - new Date(b.entryTime)) / 60000)
              : b.entryTime && !b.exitTime
              ? Math.round((Date.now() - new Date(b.entryTime)) / 60000)
              : null

            return (
              <div key={b._id} className={`${styles.bookingCard} ${styles['card_' + b.status]}`}>
                <div className={styles.cardLeft}>
                  <div className={styles.slotBadge}>{b.slotId}</div>
                </div>

                <div className={styles.cardMid}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>
                    #{b.bookingId}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 15, marginBottom: 3 }}>
                    {b.vehicleNumber}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {b.category?.replace('_', ' ')} · {b.vehicleType}
                  </div>

                  {b.entryTime && (
                    <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 4 }}>
                      Entry: {new Date(b.entryTime).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  )}
                  {b.exitTime && (
                    <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>
                      Exit: {new Date(b.exitTime).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  )}
                  {duration !== null && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      Duration: {duration} min
                    </div>
                  )}

                  {/* Status message for actionable states */}
                  {msg && (
                    <div className={styles.statusMsg}>
                      <span>{msg.icon}</span>
                      <span>{msg.text}</span>
                    </div>
                  )}
                </div>

                <div className={styles.cardRight}>
                  <span className={styles.statusBadge} style={{ background: st.bg, color: st.color }}>
                    {st.label}
                  </span>

                  {/* Cancel — only when reserved (not active) */}
                  {b.status === 'reserved' && (
                    <button
                      className={styles.cancelBtn}
                      onClick={() => handleCancel(b._id)}
                      disabled={!!isActioning}
                    >
                      {isActioning === 'cancel' ? '⏳' : 'Cancel'}
                    </button>
                  )}

                  {/* Request Exit — only when active */}
                  {b.status === 'active' && (
                    <button
                      className={styles.exitBtn}
                      onClick={() => handleRequestExit(b._id)}
                      disabled={!!isActioning}
                    >
                      {isActioning === 'exit' ? '⏳ Sending...' : '🚪 Request Exit'}
                    </button>
                  )}

                  {/* Exit requested — waiting state */}
                  {b.status === 'exit_requested' && (
                    <div className={styles.waitingBadge}>
                      ⏳ Waiting for admin
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
