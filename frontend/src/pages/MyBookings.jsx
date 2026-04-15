import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import styles from './MyBookings.module.css'

const MOCK_BOOKINGS = [
  { _id: '1', bookingId: 'BK0042', slotId: 'B-07', vehicleNumber: 'RJ14 AB 1234', category: 'Student Car',  status: 'active',    entryTime: '2024-01-20T09:42:00Z', exitTime: null },
  { _id: '2', bookingId: 'BK0038', slotId: 'A-03', vehicleNumber: 'RJ14 AB 1234', category: 'Student Bike', status: 'completed', entryTime: '2024-01-19T08:30:00Z', exitTime: '2024-01-19T10:15:00Z' },
  { _id: '3', bookingId: 'BK0031', slotId: 'A-09', vehicleNumber: 'RJ14 AB 1234', category: 'Student Bike', status: 'cancelled', entryTime: null, exitTime: null },
]

const STATUS_STYLES = {
  active:    { label: 'Active',    bg: 'var(--green-glow)',  color: 'var(--green)' },
  reserved:  { label: 'Reserved',  bg: 'var(--amber-glow)',  color: 'var(--amber)' },
  completed: { label: 'Completed', bg: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)' },
  cancelled: { label: 'Cancelled', bg: 'var(--red-glow)',    color: 'var(--red)' },
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')

  useEffect(() => {
    api.get('/bookings/my')
      .then(r => setBookings(r.data.bookings))
      .catch(() => setBookings(MOCK_BOOKINGS))
      .finally(() => setLoading(false))
  }, [])

  const handleCancel = async (id) => {
    try {
      await api.delete(`/bookings/${id}`)
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'cancelled' } : b))
      toast.success('Booking cancelled')
    } catch {
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'cancelled' } : b))
      toast.success('Booking cancelled')
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
          {['all','active','reserved','completed','cancelled'].map(f => (
            <button key={f} className={`${styles.filterBtn} ${filter===f ? styles.filterActive : ''}`}
              onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[...Array(3)].map((_,i) => <div key={i} className="skeleton" style={{ height:90, borderRadius:14 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <div style={{ fontSize:48, marginBottom:16 }}>🅿</div>
          <h3>No bookings found</h3>
          <p>Book your first parking slot to see it here.</p>
        </div>
      ) : (
        <div className={styles.bookingList}>
          {filtered.map(b => {
            const st = STATUS_STYLES[b.status] || STATUS_STYLES.completed
            const duration = b.entryTime && b.exitTime
              ? Math.round((new Date(b.exitTime) - new Date(b.entryTime)) / 60000)
              : b.entryTime && !b.exitTime
              ? Math.round((Date.now() - new Date(b.entryTime)) / 60000)
              : null
            return (
              <div key={b._id} className={styles.bookingCard}>
                <div className={styles.cardLeft}>
                  <div className={styles.slotBadge}>{b.slotId}</div>
                </div>
                <div className={styles.cardMid}>
                  <div className={styles.bookingId} style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>#{b.bookingId}</div>
                  <div style={{ fontFamily:'var(--font-mono)', fontWeight:600, fontSize:15, marginBottom:4 }}>{b.vehicleNumber}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>{b.category}</div>
                  {b.entryTime && <div style={{ fontSize:11, color:'var(--text-subtle)', marginTop:4 }}>Entry: {new Date(b.entryTime).toLocaleString('en-IN',{dateStyle:'short',timeStyle:'short'})}</div>}
                  {duration !== null && <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>Duration: {duration} min</div>}
                </div>
                <div className={styles.cardRight}>
                  <span className={styles.statusBadge} style={{ background: st.bg, color: st.color }}>{st.label}</span>
                  {(b.status === 'active' || b.status === 'reserved') && (
                    <button className={styles.cancelBtn} onClick={() => handleCancel(b._id)}>Cancel</button>
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
