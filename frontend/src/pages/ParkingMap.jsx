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

// Derive category key from slot prefix
const prefixToCategory = { A: 'student_bike', B: 'student_car', C: 'faculty' }
// Default vehicleType per category
const defaultVehicleType = { student_bike: 'bike', student_car: 'car', faculty: 'car' }

export default function ParkingMap() {
  const { user } = useAuth()
  const [slots, setSlots]         = useState({})
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(null)   // slotId string
  const [booking, setBooking]     = useState(false)
  const [vehicleNum, setVehicleNum] = useState('')
  const [vehicleType, setVehicleType] = useState('')

  const fetchSlots = async () => {
    try {
      const { data } = await api.get('/slots')
      const map = {}
      data.slots.forEach(s => { map[s.slotId] = s.status })
      setSlots(map)
    } catch {
      // Mock slots if API unavailable
      const map = {}
      ZONES.forEach(z => {
        for (let i = 1; i <= z.count; i++) {
          const id = `${z.prefix}-${String(i).padStart(2, '0')}`
          map[id] = ['A-02','A-06','A-08','B-01','B-04','B-09','C-01','C-03','C-05'].includes(id)
            ? 'occupied' : ['A-04','B-05','C-07'].includes(id) ? 'reserved' : 'available'
        }
      })
      setSlots(map)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSlots() }, [])
  useSocket({ 'slot:updated': fetchSlots })

  const handleSlotClick = (id) => {
    if (slots[id] !== 'available') {
      toast.error(`Slot ${id} is ${slots[id]}`)
      return
    }
    setSelected(id)
    // Pre-fill default vehicleType based on zone prefix
    const prefix = id[0]
    const cat = prefixToCategory[prefix]
    setVehicleType(defaultVehicleType[cat] || 'car')
    setVehicleNum('')
  }

  const handleBook = async () => {
    if (!vehicleNum.trim()) { toast.error('Enter vehicle number'); return }
    if (!selected) return

    const prefix   = selected[0]                        // 'A', 'B', or 'C'
    const category = prefixToCategory[prefix]           // ✅ correct category from zone

    setBooking(true)
    try {
      await api.post('/bookings', {
        vehicleNumber: vehicleNum.toUpperCase(),
        vehicleType:   vehicleType,
        category:      category,                        // ✅ 'student_bike' / 'student_car' / 'faculty'
        preferredSlot: selected,                        // ✅ books the exact slot clicked
      })
      toast.success(`✅ Slot ${selected} booked!`)
      setSlots(prev => ({ ...prev, [selected]: 'reserved' }))
      setSelected(null)
      setVehicleNum('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed')
    } finally {
      setBooking(false)
    }
  }

  const counts = { available: 0, occupied: 0, reserved: 0 }
  Object.values(slots).forEach(s => { counts[s] = (counts[s] || 0) + 1 })

  // Zone label for selected slot
  const selectedZone = selected
    ? ZONES.find(z => z.prefix === selected[0])
    : null

  // Vehicle type options per zone
  const typeOptions = {
    student_bike: [{ value: 'bike', label: 'Motorcycle / Bike' }, { value: 'scooter', label: 'Scooter' }],
    student_car:  [{ value: 'car',  label: 'Car' },               { value: 'suv',     label: 'SUV / Jeep' }],
    faculty:      [{ value: 'car',  label: 'Car' },               { value: 'suv',     label: 'SUV / Jeep' }, { value: 'bike', label: 'Bike' }],
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Parking Map</h1>
          <p className={styles.subtitle}>Click an available slot to book instantly</p>
        </div>
        <div className={styles.legend}>
          <LegendItem color="green" label={`Available (${counts.available})`} />
          <LegendItem color="red"   label={`Occupied (${counts.occupied})`} />
          <LegendItem color="amber" label={`Reserved (${counts.reserved})`} />
        </div>
      </div>

      {loading ? (
        <div className={styles.loadWrap}>
          <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid var(--border-md)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
        </div>
      ) : (
        <div className={styles.mapWrap}>
          {ZONES.map(zone => (
            <div key={zone.key} className={styles.zone}>
              <div className={styles.zoneLabel}>{zone.label} Zone</div>
              <div className={styles.slotGrid}>
                {Array.from({ length: zone.count }, (_, i) => {
                  const id     = `${zone.prefix}-${String(i + 1).padStart(2, '0')}`
                  const status = slots[id] || 'available'
                  return (
                    <div
                      key={id}
                      className={`${styles.slot} ${styles[status]} ${selected === id ? styles.slotSelected : ''}`}
                      onClick={() => handleSlotClick(id)}
                      title={`${id} — ${status}`}
                    >
                      <span className={styles.slotId}>{id}</span>
                      <span className={styles.slotStatus}>
                        {status === 'available' ? '✓' : status === 'occupied' ? '●' : '◷'}
                      </span>
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
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 6 }}>
              {selectedZone?.label} Zone
            </p>
            <p style={{ color: 'var(--text-subtle)', fontSize: 12, marginBottom: 18 }}>
              This slot will be reserved specifically for <strong>{selected}</strong>
            </p>

            <input
              className={styles.vehicleInput}
              placeholder="Vehicle number e.g. RJ14AB1234"
              value={vehicleNum}
              onChange={e => setVehicleNum(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleBook()}
              autoFocus
              style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 10 }}
            />

            <select
              className={styles.vehicleInput}
              value={vehicleType}
              onChange={e => setVehicleType(e.target.value)}
              style={{ marginBottom: 16 }}
            >
              {(typeOptions[prefixToCategory[selected[0]]] || []).map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <button className={styles.bookBtn} onClick={handleBook} disabled={booking}>
              {booking ? '⏳ Booking...' : `✅ Book ${selected}`}
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
