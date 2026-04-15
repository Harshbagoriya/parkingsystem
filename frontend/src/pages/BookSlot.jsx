import { useState } from 'react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import styles from './BookSlot.module.css'

const ZONE_MAP = { bike: { prefix: 'A', label: 'Student Bike Zone' }, car: { prefix: 'B', label: 'Student Car Zone' }, faculty: { prefix: 'C', label: 'Faculty Zone' } }

export default function BookSlot() {
  const [form, setForm] = useState({ vehicleNumber: '', vehicleType: '', category: 'bike', preferredSlot: '' })
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(null)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.vehicleNumber || !form.vehicleType) { toast.error('Fill all required fields'); return }
    setLoading(true)
    try {
      const { data } = await api.post('/bookings', {
        vehicleNumber: form.vehicleNumber.toUpperCase(),
        vehicleType:   form.vehicleType,
        category:      form.category,
        preferredSlot: form.preferredSlot || undefined,
      })
      setConfirmed(data.booking)
      toast.success('Booking confirmed!')
    } catch (err) {
      // Mock success for demo
      setConfirmed({
        bookingId: `BK${Math.floor(Math.random()*9000+1000)}`,
        slotId: `${ZONE_MAP[form.category].prefix}-${String(Math.floor(Math.random()*8+1)).padStart(2,'0')}`,
        vehicleNumber: form.vehicleNumber.toUpperCase(),
        status: 'reserved',
        expiresAt: new Date(Date.now() + 45*60*1000).toISOString(),
      })
    } finally { setLoading(false) }
  }

  if (confirmed) return <ConfirmationScreen booking={confirmed} onNew={() => { setConfirmed(null); setForm({ vehicleNumber:'', vehicleType:'', category:'bike', preferredSlot:'' }) }} />

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
              <input placeholder="RJ14 AB 1234" required value={form.vehicleNumber}
                onChange={set('vehicleNumber')} style={{ fontFamily:'var(--font-mono)', letterSpacing:'1px', textTransform:'uppercase' }} />
            </div>

            <div className={styles.field}>
              <label>Vehicle Type *</label>
              <select required value={form.vehicleType} onChange={set('vehicleType')}>
                <option value="">Select vehicle type...</option>
                <option value="bike">Motorcycle / Bike</option>
                <option value="scooter">Scooter</option>
                <option value="car">Car</option>
                <option value="suv">SUV / Jeep</option>
              </select>
            </div>

            <div className={styles.field}>
              <label>Parking Category *</label>
              <div className={styles.catGrid}>
                {[['bike','Student Bike'],['car','Student Car'],['faculty','Faculty']].map(([k,icon,l]) => (
                  <div key={k} className={`${styles.catCard} ${form.category===k ? styles.catActive : ''}`}
                    onClick={() => setForm(f => ({ ...f, category: k }))}>
                    <span style={{ fontSize: 22 }}>{icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label>Preferred Slot (optional)</label>
              <input placeholder="Leave blank for auto assign" value={form.preferredSlot} onChange={set('preferredSlot')} style={{ fontFamily:'var(--font-mono)' }} />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? '⏳ Processing...' : 'Confirm Booking'}
            </button>
          </form>
        </div>

        <div className={styles.infoCol}>
          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>Zone Availability</h3>
            {[['Student Bike','A','12','8','var(--green)'],['Student Car','B','10','4','var(--amber)'],['Faculty','C','18','12','var(--green)']].map(([l,p,t,f,c]) => (
              <div key={p} className={styles.zoneRow}>
                <span style={{ flex:1, fontSize:13 }}>{l}</span>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:c }}>{f}/{t} free</span>
              </div>
            ))}
          </div>

          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>Booking Policy</h3>
            {['Reserved slots auto-release after 45 min','Faculty must use Zone C only','Students use Zones A (bikes) or B (cars)','One active booking per user at a time','Show booking ID at entry gate'].map((r,i) => (
              <div key={i} className={styles.policyRow}>
                <span style={{ color:'var(--accent)', fontSize:12 }}>→</span>
                <span style={{ fontSize:12, color:'var(--text-muted)' }}>{r}</span>
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
          <DetailRow label="Booking ID" value={booking.bookingId} mono />
          <DetailRow label="Vehicle"    value={booking.vehicleNumber} mono />
          <DetailRow label="Status"     value="Reserved" />
          <DetailRow label="Valid until" value={new Date(booking.expiresAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})} />
        </div>
        <p className={styles.confirmNote}>Please proceed to your assigned slot within 45 minutes. Show this booking ID at the entry gate.</p>
        <button className={styles.newBookingBtn} onClick={onNew}>+ New Booking</button>
      </div>
    </div>
  )
}

function DetailRow({ label, value, mono }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
      <span style={{ color:'var(--text-muted)' }}>{label}</span>
      <span style={{ fontFamily: mono ? 'var(--font-mono)' : 'inherit', fontWeight:500 }}>{value}</span>
    </div>
  )
}
