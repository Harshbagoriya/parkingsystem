import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import styles from './EntryExit.module.css'

const MOCK_LOG = [
  { _id:1, type:'entry', vehicleNumber:'RJ14 AB 1234', slotId:'B-07', time:'09:42 AM', duration:null },
  { _id:2, type:'exit',  vehicleNumber:'RJ14 CD 5678', slotId:'A-03', time:'09:38 AM', duration:'1h 22m' },
  { _id:3, type:'entry', vehicleNumber:'DL01 XY 7890', slotId:'C-12', time:'09:15 AM', duration:null },
  { _id:4, type:'exit',  vehicleNumber:'MH02 AA 1111', slotId:'B-02', time:'08:55 AM', duration:'45m' },
]

export default function EntryExit() {
  const [entryVeh, setEntryVeh] = useState('')
  const [entrySlot, setEntrySlot] = useState('')
  const [exitVeh,  setExitVeh]  = useState('')
  const [exitInfo, setExitInfo] = useState(null)
  const [log, setLog] = useState(MOCK_LOG)
  const [loadingEntry, setLoadingEntry] = useState(false)
  const [loadingExit,  setLoadingExit]  = useState(false)

  // Simulate lookup when exit vehicle is typed
  useEffect(() => {
    if (exitVeh.length > 4) {
      setExitInfo({ slotId: 'B-07', entryTime: new Date(Date.now() - 134*60*1000), duration: '2h 14m' })
    } else {
      setExitInfo(null)
    }
  }, [exitVeh])

  const recordEntry = async () => {
    if (!entryVeh.trim()) { toast.error('Enter vehicle number'); return }
    setLoadingEntry(true)
    try {
      await api.post('/entry-exit/entry', { vehicleNumber: entryVeh.toUpperCase(), slotId: entrySlot || undefined })
    } catch { /* demo fallback */ }
    const slot = entrySlot || `B-0${Math.floor(Math.random()*5+1)}`
    setLog(prev => [{
      _id: Date.now(), type:'entry', vehicleNumber: entryVeh.toUpperCase(),
      slotId: slot, time: new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}), duration:null
    }, ...prev])
    toast.success(`✅ Entry recorded — ${entryVeh.toUpperCase()} → Slot ${slot}`)
    setEntryVeh(''); setEntrySlot('')
    setLoadingEntry(false)
  }

  const recordExit = async () => {
    if (!exitVeh.trim()) { toast.error('Enter vehicle number'); return }
    setLoadingExit(true)
    try {
      await api.post('/entry-exit/exit', { vehicleNumber: exitVeh.toUpperCase() })
    } catch { /* demo fallback */ }
    setLog(prev => [{
      _id: Date.now(), type:'exit', vehicleNumber: exitVeh.toUpperCase(),
      slotId: exitInfo?.slotId || '—', time: new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}),
      duration: exitInfo?.duration || '—'
    }, ...prev])
    toast.success(`🚪 Exit recorded — Slot ${exitInfo?.slotId || '—'} is now available`)
    setExitVeh(''); setExitInfo(null)
    setLoadingExit(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Entry / Exit Management</h1>
        <p className={styles.subtitle}>Record vehicle check-in and check-out events</p>
      </div>

      <div className={styles.gateRow}>
        {/* Entry gate */}
        <div className={`${styles.gateCard} ${styles.entryCard}`}>
          <div className={styles.gateIcon}>→</div>
          <h2 className={styles.gateTitle}>Vehicle Entry</h2>
          <div className={styles.gateForm}>
            <div className={styles.field}>
              <label>Vehicle Number</label>
              <input className={styles.plateInput} placeholder="Scan or type plate..." value={entryVeh}
                onChange={e => setEntryVeh(e.target.value.toUpperCase())} onKeyDown={e => e.key==='Enter' && recordEntry()} />
            </div>
            <div className={styles.field}>
              <label>Slot (auto-detect or manual)</label>
              <input style={{ fontFamily:'var(--font-mono)' }} placeholder="e.g. B-07" value={entrySlot} onChange={e => setEntrySlot(e.target.value.toUpperCase())} />
            </div>
            <button className={`${styles.gateBtn} ${styles.entryBtn}`} onClick={recordEntry} disabled={loadingEntry}>
              {loadingEntry ? '⏳ Recording...' : '✅ Record Entry'}
            </button>
          </div>
        </div>

        {/* Exit gate */}
        <div className={`${styles.gateCard} ${styles.exitCard}`}>
          <div className={`${styles.gateIcon} ${styles.exitIcon}`}>←</div>
          <h2 className={styles.gateTitle}>Vehicle Exit</h2>
          <div className={styles.gateForm}>
            <div className={styles.field}>
              <label>Vehicle Number</label>
              <input className={styles.plateInput} placeholder="Scan or type plate..." value={exitVeh}
                onChange={e => setExitVeh(e.target.value.toUpperCase())} onKeyDown={e => e.key==='Enter' && recordExit()} />
            </div>
            {exitInfo && (
              <div className={styles.parkingInfo}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:12, color:'var(--text-muted)' }}>Slot</span>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:600 }}>{exitInfo.slotId}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:12, color:'var(--text-muted)' }}>Entry time</span>
                  <span style={{ fontSize:12 }}>{exitInfo.entryTime.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:12, color:'var(--text-muted)' }}>Duration</span>
                  <span style={{ fontSize:12, fontWeight:600, color:'var(--amber)' }}>{exitInfo.duration}</span>
                </div>
              </div>
            )}
            {!exitInfo && <div style={{ height:72, background:'var(--bg-base)', borderRadius:8, border:'1px dashed var(--border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:12, color:'var(--text-subtle)' }}>Enter plate to look up parking info</span>
            </div>}
            <button className={`${styles.gateBtn} ${styles.exitBtn}`} onClick={recordExit} disabled={loadingExit}>
              {loadingExit ? '⏳ Recording...' : '🚪 Record Exit & Free Slot'}
            </button>
          </div>
        </div>
      </div>

      {/* Log */}
      <div className={styles.logPanel}>
        <div className={styles.logHeader}>
          <span>Today's Entry / Exit Log</span>
          <span style={{ fontSize:11, color:'var(--text-muted)' }}>{log.length} events</span>
        </div>
        <div className={styles.logBody}>
          {log.map(entry => (
            <div key={entry._id} className={styles.logRow}>
              <div className={`${styles.logDot} ${entry.type==='entry' ? styles.dotEntry : styles.dotExit}`} />
              <div style={{ flex:1 }}>
                <span style={{ fontFamily:'var(--font-mono)', fontWeight:600, fontSize:13 }}>{entry.vehicleNumber}</span>
                <span style={{ marginLeft:10, fontSize:11, color:'var(--text-muted)' }}>
                  {entry.type==='entry' ? '→ Entry' : '← Exit'} · Slot {entry.slotId}
                  {entry.duration && ` · ${entry.duration}`}
                </span>
              </div>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)' }}>{entry.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
