import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useSocket } from '../hooks/useSocket'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import styles from './ParkingMap.module.css'

const ZONES = [
  { key: 'student_bike', label: 'Student Bike', prefix: 'A', count: 12 },
  { key: 'student_car',  label: 'Student Car',  prefix: 'B', count: 10 },
  { key: 'faculty',      label: 'Faculty',       prefix: 'C', count: 18 },
]

export default function ParkingMap() {
  const { user } = useAuth()
  const [slots, setSlots]     = useState({})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [booking, setBooking]   = useState(false)
  const [vehicleNum, setVehicleNum] = useState('')

  const fetchSlots = async () => {
    try {
      const { data } = await api.get('/slots')
      const map = {}
      data.slots.forEach(s => { map[s.slotId] = s.status })
      setSlots(map)
    } catch {
      // Mock slots
      const map = {}
      ZONES.forEach(z => {
        for (let i = 1; i <= z.count; i++) {
          const id = `${z.prefix}-${String(i).padStart(2,'0')}`
          map[id] = ['A-02','A-06','A-08','B-01','B-04','B-09','C-01','C-03','C-05'].includes(id)
            ? 'occupied' : ['A-04','B-05','C-07'].includes(id) ? 'reserved' : 'available'
        }
      })
      setSlots(map)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchSlots() }, [])
  useSocket({ 'slot:updated': fetchSlots })

  const handleSlotClick = (id) => {
    if (slots[id] !== 'available') {
      toast.error(`Slot ${id} is ${slots[id]}`)
      return
    }
    setSelected(id)
  }

  const handleBook = async () => {
    if (!vehicleNum.trim()) { toast.error('Enter vehicle number'); return }
    setBooking(true)
    try {
      await api.post('/bookings', { slotId: selected, vehicleNumber: vehicleNum.toUpperCase() })
      toast.success(`✅ Slot ${selected} booked!`)
      setSlots(prev => ({ ...prev, [selected]: 'reserved' }))
      setSelected(null)
      setVehicleNum('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed')
    } finally { setBooking(false) }
  }

  const counts = { available: 0, occupied: 0, reserved: 0 }
  Object.values(slots).forEach(s => counts[s] = (counts[s] || 0) + 1)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Parking Map</h1>
          <p className={styles.subtitle}>Click an available slot to book instantly</p>
        </div>
        <div className={styles.legend}>
          <LegendItem color="green"  label={`Available (${counts.available})`} />
          <LegendItem color="red"    label={`Occupied (${counts.occupied})`} />
          <LegendItem color="amber"  label={`Reserved (${counts.reserved})`} />
        </div>
      </div>

      {loading ? (
        <div className={styles.loadWrap}><div className="animate-spin" style={{ width:32, height:32, border:'3px solid var(--border-md)', borderTopColor:'var(--accent)', borderRadius:'50%' }} /></div>
      ) : (
        <div className={styles.mapWrap}>
          {ZONES.map(zone => (
            <div key={zone.key} className={styles.zone}>
              <div className={styles.zoneLabel}>{zone.label}</div>
              <div className={styles.slotGrid}>
                {Array.from({ length: zone.count }, (_, i) => {
                  const id     = `${zone.prefix}-${String(i+1).padStart(2,'0')}`
                  const status = slots[id] || 'available'
                  return (
                    <div key={id}
                      className={`${styles.slot} ${styles[status]} ${selected === id ? styles.slotSelected : ''}`}
                      onClick={() => handleSlotClick(id)}
                      title={`${id} — ${status}`}
                    >
                      <span className={styles.slotId}>{id}</span>
                      <span className={styles.slotStatus}>{status === 'available' ? '✓' : status === 'occupied' ? '●' : '◷'}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking modal */}
      {selected && (
        <div className={styles.bookingOverlay} onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className={styles.bookingModal}>
            <button className={styles.closeBtn} onClick={() => setSelected(null)}>✕</button>
            <div className={styles.slotBig}>{selected}</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
              Enter your vehicle number to confirm booking
            </p>
            <input
              className={styles.vehicleInput}
              placeholder="e.g. RJ14 AB 1234"
              value={vehicleNum}
              onChange={e => setVehicleNum(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleBook()}
              autoFocus
            />
            <button className={styles.bookBtn} onClick={handleBook} disabled={booking}>
              {booking ? '⏳ Booking...' : '✅ Confirm Booking'}
            </button>
            <p style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 10 }}>
              Reserved slots auto-release after 45 minutes if not checked in
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function LegendItem({ color, label }) {
  const c = { green: 'var(--green)', red: 'var(--red)', amber: 'var(--amber)' }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
      <div style={{ width: 10, height: 10, borderRadius: 3, background: c[color] }} />
      {label}
    </div>
  )
}
