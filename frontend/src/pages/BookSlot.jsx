import { useState } from 'react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import styles from './BookSlot.module.css'

// These must match backend CATEGORY_ZONE keys exactly
const CATEGORIES = [
  { key: 'student_bike', label: 'Student Bike', zone: 'A', icon: '🏍️' },
  { key: 'student_car',  label: 'Student Car',  zone: 'B', icon: '🚗' },
  { key: 'faculty',      label: 'Faculty',      zone: 'C', icon: '🎓' },
]

// vehicleType options per category
const TYPE_OPTIONS = {
  student_bike: [
    { value: 'bike',    label: 'Motorcycle / Bike' },
    { value: 'scooter', label: 'Scooter' },
  ],
  student_car: [
    { value: 'car', label: 'Car' },
    { value: 'suv', label: 'SUV / Jeep' },
  ],
  faculty: [
    { value: 'car', label: 'Car' },
    { value: 'suv', label: 'SUV / Jeep' },
    { value: 'bike', label: 'Motorcycle / Bike' },
  ],
}

export default function BookSlot() {
  const [form, setForm] = useState({
    vehicleNumber: '',
    vehicleType: '',
    category: 'student_bike',
    preferredSlot: '',
  })
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(null)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  // When category changes, reset vehicleType so user picks again
  const setCategory = key => setForm(f => ({ ...f, category: key, vehicleType: '' }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.vehicleNumber || !form.vehicleType) {
      toast.error('Fill all required fields')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/bookings', {
        vehicleNumber: form.vehicleNumber.toUpperCase(),
        vehicleType:   form.vehicleType,
        category:      form.category,           // ✅ now matches backend: 'student_bike', 'student_car', 'faculty'
        preferredSlot: form.preferredSlot.toUpperCase() || undefined,  // ✅ properly sent to backend
      })
      setConfirmed(data.booking)
      toast.success('Booking confirmed!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed')
    } finally {
      setLoading(false)
    }
  }

  if (confirmed) return (
    <ConfirmationScreen
      booking={confirmed}
      onNew={() => {
        setConfirmed(null)
        setForm({ vehicleNumber: '', vehicleType: '', category: 'student_bike', preferredSlot: '' })
      }}
    />
  )

  const selectedCat = CATEGORIES.find(c => c.key === form.category)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Book a Slot</h1>
        <p className={styles.subtitle}>Reserve your parking slot in advance</p>
      </div>

      <div className={styles.grid}>
        <div className={styles.formCard}>
          <form onSubmit={handleSubmit} className={styles.form}>

            <div className={styles.field}>
              <label>Vehicle Number *</label>
              <input
                placeholder="RJ14 AB 1234"
                required
                value={form.vehicleNumber}
                onChange={set('vehicleNumber')}
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '1px', textTransform: 'uppercase' }}
              />
            </div>

            <div className={styles.field}>
              <label>Parking Category *</label>
              <div className={styles.catGrid}>
                {CATEGORIES.map(c => (
                  <div
                    key={c.key}
                    className={`${styles.catCard} ${form.category === c.key ? styles.catActive : ''}`}
                    onClick={() => setCategory(c.key)}
                  >
                    <span style={{ fontSize: 22 }}>{c.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{c.label}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-subtle)' }}>Zone {c.zone}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label>Vehicle Type *</label>
              <select required value={form.vehicleType} onChange={set('vehicleType')}>
                <option value="">Select vehicle type...</option>
                {TYPE_OPTIONS[form.category].map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {/* Helpful hint if mismatch zone */}
              {form.category === 'student_bike' && (
                <p style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4 }}>
                  ℹ️ Bikes & scooters → Zone A (Student Bike)
                </p>
              )}
              {form.category === 'student_car' && (
                <p style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4 }}>
                  ℹ️ Cars & SUVs → Zone B (Student Car)
                </p>
              )}
            </div>

            <div className={styles.field}>
              <label>Preferred Slot <span style={{ color: 'var(--text-subtle)', fontSize: 11 }}>(optional — e.g. {selectedCat?.zone}-01)</span></label>
              <input
                placeholder={`Leave blank for auto-assign in Zone ${selectedCat?.zone}`}
                value={form.preferredSlot}
                onChange={set('preferredSlot')}
                style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? '⏳ Processing...' : 'Confirm Booking'}
            </button>
          </form>
        </div>

        <div className={styles.infoCol}>
          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>Zone Guide</h3>
            {CATEGORIES.map(c => (
              <div key={c.key} className={styles.zoneRow}>
                <span style={{ fontSize: 16 }}>{c.icon}</span>
                <span style={{ flex: 1, fontSize: 13 }}>{c.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>Zone {c.zone}</span>
              </div>
            ))}
          </div>

          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>Booking Policy</h3>
            {[
              'Reserved slots auto-release after 45 min',
              'Faculty must use Zone C only',
              'Bikes & scooters → Zone A only',
              'Cars & SUVs → Zone B only',
              'One active booking per user at a time',
              'Show booking ID at entry gate',
            ].map((r, i) => (
              <div key={i} className={styles.policyRow}>
                <span style={{ color: 'var(--accent)', fontSize: 12 }}>→</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ConfirmationScreen({ booking, onNew }) {
  return (
    <div className={styles.confirmPage}>
      <div className={styles.confirmCard}>
        <div className={styles.checkmark}>✓</div>
        <h2 className={styles.confirmTitle}>Booking Confirmed!</h2>
        <div className={styles.slotDisplay}>{booking.slotId}</div>
        <div className={styles.confirmDetails}>
          <DetailRow label="Booking ID"  value={`#${booking.bookingId}`} mono />
          <DetailRow label="Vehicle"     value={booking.vehicleNumber} mono />
          <DetailRow label="Category"    value={booking.category?.replace('_', ' ')} />
          <DetailRow label="Status"      value="Reserved" />
          <DetailRow label="Valid until" value={new Date(booking.expiresAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} />
        </div>
        <p className={styles.confirmNote}>
          Please proceed to your assigned slot within 45 minutes. Show this booking ID at the entry gate.
        </p>
        <button className={styles.newBookingBtn} onClick={onNew}>+ New Booking</button>
      </div>
    </div>
  )
}

function DetailRow({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontFamily: mono ? 'var(--font-mono)' : 'inherit', fontWeight: 500, textTransform: 'capitalize' }}>{value}</span>
    </div>
  )
}
