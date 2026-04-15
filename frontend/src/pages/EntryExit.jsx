import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import styles from './EntryExit.module.css'

const formatDuration = (minutes) => {
  if (!minutes) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function EntryExit() {
  const [entryVeh, setEntryVeh] = useState('')
  const [entrySlot, setEntrySlot] = useState('')
  const [exitVeh,  setExitVeh]  = useState('')
  const [exitInfo, setExitInfo] = useState(null)
  const [exitLookupLoading, setExitLookupLoading] = useState(false)
  const [log, setLog] = useState([])
  const [logLoading, setLogLoading] = useState(true)
  const [loadingEntry, setLoadingEntry] = useState(false)
  const [loadingExit,  setLoadingExit]  = useState(false)

  // Fetch today's real log from backend
  const fetchLog = useCallback(async () => {
    try {
      const { data } = await api.get('/entry-exit/log')
      const formatted = (data.logs || []).map(l => ({
        _id: l._id,
        type: l.type,
        vehicleNumber: l.vehicleNumber,
        slotId: l.slotId,
        time: new Date(l.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        duration: l.durationMin ? formatDuration(l.durationMin) : null,
      }))
      setLog(formatted)
    } catch {
      // If backend unavailable, keep empty log
    } finally {
      setLogLoading(false)
    }
  }, [])

  useEffect(() => { fetchLog() }, [fetchLog])

  // Auto-refresh log every 30 seconds to stay in sync
  useEffect(() => {
    const interval = setInterval(() => fetchLog(), 30000)
    return () => clearInterval(interval)
  }, [fetchLog])

  // Real lookup when exit vehicle is typed (debounced)
  useEffect(() => {
    if (exitVeh.length < 4) { setExitInfo(null); return }
    const timer = setTimeout(async () => {
      setExitLookupLoading(true)
      try {
        const { data } = await api.get(`/bookings?vehicleNumber=${exitVeh.toUpperCase()}&status=active`)
        const booking = data.bookings?.[0]
        if (booking) {
          const entryTime = new Date(booking.entryTime)
          const durationMin = Math.round((Date.now() - entryTime) / 60000)
          setExitInfo({
            slotId: booking.slotId,
            entryTime,
            duration: formatDuration(durationMin),
          })
        } else {
          setExitInfo(null)
        }
      } catch {
        setExitInfo(null)
      } finally {
        setExitLookupLoading(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [exitVeh])

  const recordEntry = async () => {
    if (!entryVeh.trim()) { toast.error('Enter vehicle number'); return }
    setLoadingEntry(true)
    try {
      const { data } = await api.post('/entry-exit/entry', {
        vehicleNumber: entryVeh.toUpperCase(),
        slotId: entrySlot || undefined,
      })
      toast.success(`✅ Entry recorded — ${entryVeh.toUpperCase()} → Slot ${data.slotId}`)
      setEntryVeh(''); setEntrySlot('')
      await fetchLog() // refresh real log
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record entry')
    } finally {
      setLoadingEntry(false)
    }
  }

  const recordExit = async () => {
    if (!exitVeh.trim()) { toast.error('Enter vehicle number'); return }
    setLoadingExit(true)
    try {
      const { data } = await api.post('/entry-exit/exit', {
        vehicleNumber: exitVeh.toUpperCase(),
      })
      toast.success(`🚪 Exit recorded — Slot ${data.slotId} is now available`)
      setExitVeh('')
      setExitInfo(null)
      // Small delay to let MongoDB write propagate before re-fetching log
      setTimeout(() => fetchLog(), 500)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record exit')
    } finally {
      setLoadingExit(false)
    }
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
              <span style={{ fontSize:12, color:'var(--text-subtle)' }}>{exitLookupLoading ? '🔍 Looking up...' : 'Enter plate to look up parking info'}</span>
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
          {logLoading && <div style={{ padding:'16px', textAlign:'center', fontSize:12, color:'var(--text-muted)' }}>Loading log...</div>}
          {!logLoading && log.length === 0 && <div style={{ padding:'16px', textAlign:'center', fontSize:12, color:'var(--text-muted)' }}>No events recorded today</div>}
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
