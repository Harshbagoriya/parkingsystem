import { useState } from 'react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import styles from './AdminSlots.module.css'

export default function AdminSlots() {
  const [areaForm, setAreaForm] = useState({ name:'', category:'student_bike', slots:'' })
  const [slotForm, setSlotForm] = useState({ slotId:'', status:'available' })
  const [areas, setAreas] = useState([
    { _id:'1', name:'Block A - Ground', category:'Student Bike', totalSlots:12, available:8  },
    { _id:'2', name:'Block B - Ground', category:'Student Car',  totalSlots:10, available:4  },
    { _id:'3', name:'Block C - Level 1',category:'Faculty',      totalSlots:18, available:12 },
  ])

  const addArea = async (e) => {
    e.preventDefault()
    if (!areaForm.name || !areaForm.slots) { toast.error('Fill all fields'); return }
    const newArea = {
      _id: Date.now().toString(),
      name: areaForm.name,
      category: areaForm.category === 'student_bike' ? 'Student Bike' : areaForm.category === 'student_car' ? 'Student Car' : 'Faculty',
      totalSlots: parseInt(areaForm.slots),
      available: parseInt(areaForm.slots),
    }
    setAreas(prev => [...prev, newArea])
    toast.success(`Area "${areaForm.name}" added with ${areaForm.slots} slots`)
    setAreaForm({ name:'', category:'student_bike', slots:'' })
  }

  const removeArea = (id) => {
    setAreas(prev => prev.filter(a => a._id !== id))
    toast.success('Area removed')
  }

  const updateSlot = async (e) => {
    e.preventDefault()
    if (!slotForm.slotId) { toast.error('Enter slot ID'); return }
    try {
      await api.patch(`/slots/${slotForm.slotId}`, { status: slotForm.status })
    } catch { /* demo fallback */ }
    toast.success(`Slot ${slotForm.slotId.toUpperCase()} set to ${slotForm.status}`)
    setSlotForm({ slotId:'', status:'available' })
  }

  const STATUS_COLOR = { available:'var(--green)', occupied:'var(--red)', reserved:'var(--amber)' }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Manage Parking Slots</h1>
        <p className={styles.subtitle}>Add parking areas and update slot statuses</p>
      </div>

      <div className={styles.grid}>
        {/* Add area */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Add Parking Area</h2>
          <form onSubmit={addArea} className={styles.form}>
            <div className={styles.field}>
              <label>Area / Block Name</label>
              <input placeholder="e.g. Block D - Basement" required
                value={areaForm.name} onChange={e => setAreaForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className={styles.field}>
              <label>Category</label>
              <select value={areaForm.category} onChange={e => setAreaForm(f => ({ ...f, category: e.target.value }))}>
                <option value="student_bike">Student Bike Zone</option>
                <option value="student_car">Student Car Zone</option>
                <option value="faculty">Faculty Zone</option>
              </select>
            </div>
            <div className={styles.field}>
              <label>Number of Slots</label>
              <input type="number" min="1" max="100" placeholder="e.g. 20" required
                value={areaForm.slots} onChange={e => setAreaForm(f => ({ ...f, slots: e.target.value }))} />
            </div>
            <button type="submit" className={styles.addBtn}>+ Add Parking Area</button>
          </form>
        </div>

        {/* Update slot status */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Update Slot Status</h2>
          <form onSubmit={updateSlot} className={styles.form}>
            <div className={styles.field}>
              <label>Slot ID</label>
              <input placeholder="e.g. A-05" value={slotForm.slotId}
                onChange={e => setSlotForm(f => ({ ...f, slotId: e.target.value.toUpperCase() }))}
                style={{ fontFamily:'var(--font-mono)', letterSpacing:'1px' }} />
            </div>
            <div className={styles.field}>
              <label>Set Status</label>
              <div className={styles.statusBtns}>
                {['available','occupied','reserved'].map(s => (
                  <div key={s} className={`${styles.statusOpt} ${slotForm.status===s ? styles.statusOptActive : ''}`}
                    style={{ '--sc': STATUS_COLOR[s] }}
                    onClick={() => setSlotForm(f => ({ ...f, status: s }))}>
                    <div className={styles.statusDot} style={{ background: STATUS_COLOR[s] }} />
                    <span style={{ fontSize:12, textTransform:'capitalize' }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.noteBox}>
              <span style={{ fontSize:11, color:'var(--text-muted)' }}>
                Slot status is also updated automatically via entry/exit events and booking actions.
              </span>
            </div>
            <button type="submit" className={styles.updateBtn}>Update Slot</button>
          </form>
        </div>
      </div>

      {/* Existing areas */}
      <div className={styles.card} style={{ marginTop:0 }}>
        <h2 className={styles.cardTitle}>Parking Areas ({areas.length})</h2>
        <div className={styles.areasGrid}>
          {areas.map(a => {
            const pct = Math.round(((a.totalSlots - a.available) / a.totalSlots) * 100)
            const color = pct > 70 ? 'var(--red)' : pct > 40 ? 'var(--amber)' : 'var(--green)'
            return (
              <div key={a._id} className={styles.areaCard}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:14, marginBottom:3 }}>{a.name}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{a.category}</div>
                  </div>
                  <button className={styles.removeBtn} onClick={() => removeArea(a._id)}>✕</button>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:8 }}>
                  <span style={{ color:'var(--text-muted)' }}>Capacity</span>
                  <span style={{ fontFamily:'var(--font-mono)' }}>{a.available}/{a.totalSlots} free</span>
                </div>
                <div style={{ height:5, background:'var(--bg-base)', borderRadius:10, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:10, transition:'width .5s' }} />
                </div>
                <div style={{ fontSize:11, color, marginTop:4 }}>{pct}% occupied</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
