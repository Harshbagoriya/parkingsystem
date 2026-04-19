import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import styles from './AdminReserve.module.css'

const CATEGORIES = [
  { key: 'student_bike', label: 'Student Bike', zone: 'A', icon: '🏍️' },
  { key: 'student_car',  label: 'Student Car',  zone: 'B', icon: '🚗' },
  { key: 'faculty',      label: 'Faculty',       zone: 'C', icon: '🎓' },
]
const VEHICLE_TYPES = {
  student_bike: [{ value: 'bike', label: 'Motorcycle / Bike' }, { value: 'scooter', label: 'Scooter' }],
  student_car:  [{ value: 'car',  label: 'Car' }, { value: 'suv', label: 'SUV / Jeep' }],
  faculty:      [{ value: 'car',  label: 'Car' }, { value: 'suv', label: 'SUV / Jeep' }, { value: 'bike', label: 'Bike' }],
}
const STATUS_STYLE = {
  reserved:  { label: 'Reserved',  color: 'var(--amber)',      bg: 'var(--amber-glow)' },
  active:    { label: 'Active',    color: 'var(--green)',      bg: 'var(--green-glow)' },
  exit_requested: { label: 'Exit Requested', color: 'var(--accent)', bg: 'rgba(61,158,255,0.12)' },
  completed: { label: 'Completed', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.04)' },
  cancelled: { label: 'Cancelled', color: 'var(--red)',        bg: 'var(--red-glow)' },
}

const EMPTY_FORM = {
  holderName: '', holderEmail: '', holderMobile: '', holderRole: 'student',
  vehicleNumber: '', vehicleType: '', category: 'student_bike',
  preferredSlot: '', notes: '',
}

export default function AdminReserve() {
  const [form, setForm]           = useState(EMPTY_FORM)
  const [loading, setLoading]     = useState(false)
  const [confirmed, setConfirmed] = useState(null)
  const [reservations, setReservations]   = useState([])
  const [listLoading, setListLoading]     = useState(true)
  const [filterStatus, setFilterStatus]   = useState('all')
  const [availableSlots, setAvailableSlots] = useState([])
  const [slotInput, setSlotInput] = useState('')
  const [actionLoading, setActionLoading] = useState({}) // { bookingId: true }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const setCategory = key => {
    setForm(f => ({ ...f, category: key, vehicleType: '', preferredSlot: '' }))
    setSlotInput('')
  }

  const fetchReservations = useCallback(async () => {
    try {
      const { data } = await api.get('/bookings/admin-reserve')
      setReservations(data.bookings || [])
    } catch (err) {
      setReservations([])
    } finally {
      setListLoading(false)
    }
  }, [])

  const fetchAvailableSlots = useCallback(async (category) => {
    try {
      const { data } = await api.get(`/slots?category=${category}&status=available`)
      setAvailableSlots(data.slots || [])
    } catch {
      setAvailableSlots([])
    }
  }, [])

  useEffect(() => { fetchReservations() }, [fetchReservations])
  useEffect(() => { fetchAvailableSlots(form.category) }, [form.category, fetchAvailableSlots])

  const selectSlot = (slotId) => {
    setForm(f => ({ ...f, preferredSlot: slotId }))
    setSlotInput(slotId)
  }
  const clearSlot = () => {
    setForm(f => ({ ...f, preferredSlot: '' }))
    setSlotInput('')
  }
  const handleSlotInputChange = (e) => {
    const val = e.target.value.toUpperCase()
    setSlotInput(val)
    setForm(f => ({ ...f, preferredSlot: val }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.holderName.trim())    { toast.error('Holder name is required'); return }
    if (!form.vehicleNumber.trim()) { toast.error('Vehicle number is required'); return }
    if (!form.vehicleType)          { toast.error('Select a vehicle type'); return }

    setLoading(true)
    try {
      const payload = {
        holderName:    form.holderName.trim(),
        holderRole:    form.holderRole,
        vehicleNumber: form.vehicleNumber.toUpperCase().trim(),
        vehicleType:   form.vehicleType,
        category:      form.category,
      }
      if (form.holderEmail.trim())   payload.holderEmail   = form.holderEmail.trim()
      if (form.holderMobile.trim())  payload.holderMobile  = form.holderMobile.trim()
      if (form.preferredSlot.trim()) payload.preferredSlot = form.preferredSlot.toUpperCase().trim()
      if (form.notes.trim())         payload.notes         = form.notes.trim()

      const { data } = await api.post('/bookings/admin-reserve', payload)
      setConfirmed(data)
      toast.success(`✅ Slot ${data.booking.slotId} reserved for ${data.holderName}`)
      setForm(EMPTY_FORM)
      setSlotInput('')
      fetchReservations()
      fetchAvailableSlots('student_bike')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reservation failed')
    } finally {
      setLoading(false)
    }
  }

  // ── Approve entry: reserved → active (slot occupied) ──────────
  const handleApproveEntry = async (r) => {
    setActionLoading(p => ({ ...p, [r._id]: 'entry' }))
    try {
      const { data } = await api.post(`/bookings/${r._id}/approve-entry`)
      toast.success(`✅ ${data.message}`)
      fetchReservations()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve entry')
    } finally {
      setActionLoading(p => ({ ...p, [r._id]: null }))
    }
  }

  // ── Approve exit: active → completed (slot freed) ─────────────
  const handleApproveExit = async (r) => {
    setActionLoading(p => ({ ...p, [r._id]: 'exit' }))
    try {
      const { data } = await api.post(`/bookings/${r._id}/approve-exit`)
      toast.success(`🚪 ${data.message}`)
      fetchReservations()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve exit')
    } finally {
      setActionLoading(p => ({ ...p, [r._id]: null }))
    }
  }

  const handleCancel = async (id, slotId) => {
    if (!window.confirm(`Cancel reservation for slot ${slotId}?`)) return
    try {
      await api.delete(`/bookings/${id}`)
      toast.success('Reservation cancelled')
      fetchReservations()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel')
    }
  }

  const filtered = filterStatus === 'all'
    ? reservations
    : reservations.filter(r => r.status === filterStatus)

  const selectedCat  = CATEGORIES.find(c => c.key === form.category)
  const visibleSlots = slotInput
    ? availableSlots.filter(s => s.slotId.includes(slotInput))
    : availableSlots

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin Reservations</h1>
          <p className={styles.subtitle}>Reserve slots and approve vehicle entry / exit with one click</p>
        </div>
      </div>

      <div className={styles.layout}>
        {/* ── Form ── */}
        <div className={styles.formSection}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <span className={styles.cardIcon}>🅿</span>
              New Reservation
            </h2>

            {confirmed && (
              <div className={styles.successBanner}>
                <div className={styles.successSlot}>{confirmed.booking.slotId}</div>
                <div>
                  <div className={styles.successTitle}>Slot Reserved!</div>
                  <div className={styles.successSub}>
                    #{confirmed.booking.bookingId} · {confirmed.holderName} · {confirmed.booking.vehicleNumber}
                  </div>
                  <div className={styles.successSub} style={{ marginTop: 2, fontSize: 11, color: 'var(--text-subtle)' }}>
                    Expires: {new Date(confirmed.booking.expiresAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
                <button className={styles.dismissBtn} onClick={() => setConfirmed(null)}>✕</button>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.sectionLabel}>👤 Holder Details</div>

              <div className={styles.row2}>
                <div className={styles.field}>
                  <label>Full Name *</label>
                  <input required placeholder="e.g. Rahul Sharma"
                    value={form.holderName} onChange={set('holderName')} />
                </div>
                <div className={styles.field}>
                  <label>Role</label>
                  <select value={form.holderRole} onChange={set('holderRole')}>
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="staff">Staff</option>
                    <option value="guest">Guest</option>
                    <option value="vip">VIP / Special</option>
                  </select>
                </div>
              </div>

              <div className={styles.row2}>
                <div className={styles.field}>
                  <label>Email <span className={styles.optional}>(optional)</span></label>
                  <input type="email" placeholder="rahul@cpu.edu.in"
                    value={form.holderEmail} onChange={set('holderEmail')} />
                </div>
                <div className={styles.field}>
                  <label>Mobile <span className={styles.optional}>(optional)</span></label>
                  <input type="tel" placeholder="98XXXXXXXX" maxLength={10}
                    value={form.holderMobile} onChange={set('holderMobile')} />
                </div>
              </div>

              <div className={styles.divider} />
              <div className={styles.sectionLabel}>🚗 Vehicle Details</div>

              <div className={styles.field}>
                <label>Parking Category *</label>
                <div className={styles.catGrid}>
                  {CATEGORIES.map(c => (
                    <div key={c.key}
                      className={`${styles.catCard} ${form.category === c.key ? styles.catActive : ''}`}
                      onClick={() => setCategory(c.key)}>
                      <span className={styles.catIcon}>{c.icon}</span>
                      <span className={styles.catLabel}>{c.label}</span>
                      <span className={styles.catZone}>Zone {c.zone}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.row2}>
                <div className={styles.field}>
                  <label>Vehicle Number *</label>
                  <input required placeholder="RJ14AB1234"
                    value={form.vehicleNumber} onChange={set('vehicleNumber')}
                    style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '1px' }} />
                </div>
                <div className={styles.field}>
                  <label>Vehicle Type *</label>
                  <select required value={form.vehicleType} onChange={set('vehicleType')}>
                    <option value="">Select type...</option>
                    {(VEHICLE_TYPES[form.category] || []).map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.divider} />
              <div className={styles.sectionLabel}>📍 Slot Assignment</div>

              <div className={styles.field}>
                <label>
                  Choose Slot
                  <span className={styles.optional}> — {availableSlots.length} available in Zone {selectedCat?.zone}</span>
                </label>
                <input
                  placeholder={`Type slot ID or leave blank for auto-assign (Zone ${selectedCat?.zone})`}
                  value={slotInput}
                  onChange={handleSlotInputChange}
                  style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 8 }}
                />
                {visibleSlots.length > 0 && (
                  <div className={styles.slotPicker}>
                    <div className={styles.slotPickerLabel}>Click to select an available slot:</div>
                    <div className={styles.slotPickerGrid}>
                      {visibleSlots.slice(0, 24).map(s => (
                        <div key={s.slotId}
                          className={`${styles.slotChip} ${form.preferredSlot === s.slotId ? styles.slotChipActive : ''}`}
                          onClick={() => selectSlot(s.slotId)}>
                          {s.slotId}
                        </div>
                      ))}
                    </div>
                    {form.preferredSlot && (
                      <button type="button" className={styles.clearSlot} onClick={clearSlot}>
                        ✕ Clear — use auto-assign
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.field}>
                <label>Notes <span className={styles.optional}>(optional)</span></label>
                <textarea placeholder="e.g. VIP guest, event parking, temporary permit..."
                  value={form.notes} onChange={set('notes')} rows={2} className={styles.textarea} />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? '⏳ Reserving...' : '✅ Reserve Slot'}
              </button>
            </form>
          </div>
        </div>

        {/* ── Reservations list ── */}
        <div className={styles.listSection}>
          <div className={styles.card}>
            <div className={styles.listHeader}>
              <h2 className={styles.cardTitle} style={{ margin: 0 }}>
                <span className={styles.cardIcon}>📋</span>
                All Reservations
              </h2>
              <span className={styles.countBadge}>{reservations.length}</span>
            </div>

            {/* Legend */}
            <div className={styles.workflowHint}>
              <span className={styles.hintStep}>🟡 Reserved → click <b>Approve Entry</b> when vehicle arrives</span>
              <span className={styles.hintStep}>🟢 Active → waiting for user to click "Request Exit"</span>
              <span className={styles.hintStep}>🔵 Exit Requested → user is at gate, click <b>Approve Exit</b> to free slot</span>
            </div>

            <div className={styles.filterRow}>
              {['all','reserved','active','completed','cancelled'].map(s => (
                <button key={s}
                  className={`${styles.filterBtn} ${filterStatus === s ? styles.filterActive : ''}`}
                  onClick={() => setFilterStatus(s)}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            <div className={styles.reservationList}>
              {listLoading && <div className={styles.emptyState}>Loading...</div>}
              {!listLoading && filtered.length === 0 && (
                <div className={styles.emptyState}>
                  No {filterStatus !== 'all' ? filterStatus : ''} reservations found
                </div>
              )}

              {filtered.map(r => {
                const st          = STATUS_STYLE[r.status] || STATUS_STYLE.completed
                const displayName = r.holderName || r.user?.name || '—'
                const displayRole = r.holderRole || r.user?.role || ''
                const isActioning = actionLoading[r._id]

                return (
                  <div key={r._id} className={`${styles.reservationCard} ${styles['card_' + r.status]}`}>
                    <div className={styles.resSlotBadge}>{r.slotId}</div>

                    <div className={styles.resInfo}>
                      <div className={styles.resName}>
                        {displayName}
                        {displayRole && <span className={styles.resRolePill}>{displayRole}</span>}
                      </div>
                      <div className={styles.resMeta}>
                        <span className={styles.resVehicle}>{r.vehicleNumber}</span>
                        <span className={styles.resDot}>·</span>
                        <span>{r.vehicleType}</span>
                        <span className={styles.resDot}>·</span>
                        <span>{r.category?.replace('_', ' ')}</span>
                        <span className={styles.resDot}>·</span>
                        <span className={styles.resId}>#{r.bookingId}</span>
                      </div>
                      {(r.holderEmail || r.holderMobile) && (
                        <div className={styles.resContact}>
                          {r.holderEmail  && <span>✉ {r.holderEmail}</span>}
                          {r.holderMobile && <span>📞 {r.holderMobile}</span>}
                        </div>
                      )}
                      {r.entryTime && (
                        <div className={styles.resTiming}>
                          In: {new Date(r.entryTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          {r.exitTime && ` · Out: ${new Date(r.exitTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                          {r.exitTime && ` · ${Math.round((new Date(r.exitTime) - new Date(r.entryTime)) / 60000)} min`}
                        </div>
                      )}
                      {r.adminNotes && (
                        <div className={styles.resNotes}>
                          📝 {r.adminNotes.length > 60 ? r.adminNotes.slice(0, 60) + '…' : r.adminNotes}
                        </div>
                      )}
                    </div>

                    <div className={styles.resRight}>
                      <span className={styles.statusBadge} style={{ background: st.bg, color: st.color }}>
                        {st.label}
                      </span>

                      {/* Approve Entry — shown when reserved */}
                      {r.status === 'reserved' && (
                        <button
                          className={styles.approveEntryBtn}
                          onClick={() => handleApproveEntry(r)}
                          disabled={!!isActioning}
                          title="Vehicle has arrived — mark as parked"
                        >
                          {isActioning === 'entry' ? '⏳' : '✅ Approve Entry'}
                        </button>
                      )}

                      {/* Approve Exit — only shown when user has requested exit */}
                      {r.status === 'exit_requested' && (
                        <button
                          className={styles.approveExitBtn}
                          onClick={() => handleApproveExit(r)}
                          disabled={!!isActioning}
                          title="Vehicle is leaving — free the slot"
                        >
                          {isActioning === 'exit' ? '⏳' : '🚪 Approve Exit'}
                        </button>
                      )}

                      {/* Cancel — shown when reserved */}
                      {r.status === 'reserved' && (
                        <button className={styles.cancelBtn}
                          onClick={() => handleCancel(r._id, r.slotId)}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
