import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useSocket } from '../hooks/useSocket'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import styles from './Dashboard.module.css'

const ZONE_COLORS = { 'Student Bike': '#3d9eff', 'Student Car': '#00d68f', 'Faculty': '#6c5ce7' }
const HOUR_DATA = [
  { h: '7am', count: 5 }, { h: '8am', count: 18 }, { h: '9am', count: 32 },
  { h: '10am', count: 38 }, { h: '11am', count: 35 }, { h: '12pm', count: 28 },
  { h: '1pm', count: 22 }, { h: '2pm', count: 30 }, { h: '3pm', count: 36 },
  { h: '4pm', count: 29 }, { h: '5pm', count: 14 }, { h: '6pm', count: 4 },
]

export default function Dashboard() {
  const { user } = useAuth()
  const isAdmin  = user?.role === 'admin'

  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [activity, setActivity] = useState([])

  const fetchStats = async () => {
    try {
      const calls = [api.get('/slots/stats')]
      if (isAdmin) calls.push(api.get('/bookings/recent'))
      const [statsRes, actRes] = await Promise.all(calls)
      setStats(statsRes.data)
      if (isAdmin) setActivity(actRes?.data.bookings || [])
    } catch {
      setStats({
        total: 40, available: 24, occupied: 12, reserved: 4,
        zones: [
          { name: 'Student Bike', total: 12, available: 8 },
          { name: 'Student Car',  total: 10, available: 4 },
          { name: 'Faculty',      total: 18, available: 12 },
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStats() }, [])
  useSocket({ 'slot:updated': fetchStats, 'booking:new': fetchStats })

  if (loading) return <LoadingSkeleton />

  const pieData      = stats.zones.map(z => ({ name: z.name, value: z.total - z.available }))
  const occupancyPct = Math.round((stats.occupied / stats.total) * 100)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>Real-time parking overview</p>
      </div>

      {/* Stat cards — both admin and user see these */}
      <div className={styles.statsGrid}>
        <StatCard label="Total Slots" value={stats.total}     color="blue"  icon="⬡" />
        <StatCard label="Available"   value={stats.available} color="green" icon="✓" pct={Math.round(stats.available / stats.total * 100)} />
        <StatCard label="Occupied"    value={stats.occupied}  color="red"   icon="●" pct={Math.round(stats.occupied  / stats.total * 100)} />
        <StatCard label="Reserved"    value={stats.reserved}  color="amber" icon="◷" pct={Math.round(stats.reserved  / stats.total * 100)} />
      </div>

      {/* ── ADMIN ONLY: Hourly Traffic + Zone Distribution + Zone Occupancy + Recent Activity ── */}
      {isAdmin && (
        <>
          <div className={styles.chartsRow}>
            {/* Hourly traffic */}
            <div className={styles.panel}>
              <div className={styles.panelHeader}><span>Hourly Traffic Today</span></div>
              <div className={styles.panelBody}>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={HOUR_DATA} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="h" tick={{ fill: '#7a8ba0', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#7a8ba0', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#141c2b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: '#e4ecf7' }}
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    />
                    <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Zone distribution */}
            <div className={styles.panel}>
              <div className={styles.panelHeader}><span>Zone Distribution</span></div>
              <div className={styles.panelBody} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <PieChart width={130} height={130}>
                  <Pie data={pieData} cx={60} cy={60} innerRadius={35} outerRadius={60} dataKey="value" stroke="none">
                    {pieData.map((e, i) => <Cell key={i} fill={Object.values(ZONE_COLORS)[i]} />)}
                  </Pie>
                </PieChart>
                <div style={{ flex: 1 }}>
                  {stats.zones.map(z => (
                    <div key={z.name} className={styles.zoneLegend}>
                      <div className={styles.zoneDot} style={{ background: ZONE_COLORS[z.name] }} />
                      <span style={{ flex: 1, fontSize: 12 }}>{z.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{z.available}/{z.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.bottomRow}>
            {/* Zone occupancy */}
            <div className={styles.panel} style={{ flex: 1 }}>
              <div className={styles.panelHeader}><span>Zone Occupancy</span></div>
              <div className={styles.panelBody}>
                {stats.zones.map(z => {
                  const pct = Math.round(((z.total - z.available) / z.total) * 100)
                  return (
                    <div key={z.name} className={styles.zoneBar}>
                      <div className={styles.zoneBarLabel}>
                        <span>{z.name}</span>
                        <span style={{ color: pct > 70 ? 'var(--red)' : pct > 40 ? 'var(--amber)' : 'var(--green)' }}>{pct}%</span>
                      </div>
                      <div className={styles.progressTrack}>
                        <div className={styles.progressFill} style={{
                          width: `${pct}%`,
                          background: pct > 70 ? 'var(--red)' : pct > 40 ? 'var(--amber)' : 'var(--green)'
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recent activity */}
            <div className={styles.panel} style={{ flex: 1 }}>
              <div className={styles.panelHeader}><span>Recent Activity</span></div>
              <div className={styles.panelBody} style={{ padding: '8px 16px' }}>
                {activity.map(b => (
                  <div key={b._id} className={styles.activityItem}>
                    <div className={styles.actDot} style={{
                      background: b.status === 'active' ? 'var(--green)' : b.status === 'reserved' ? 'var(--amber)' : 'var(--red)'
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-mono)' }}>{b.vehicleNumber}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Slot {b.slotId} · {b.status}</div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(b.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── USER ONLY: Zone availability as simple cards ── */}
      {!isAdmin && (
        <div className={styles.zoneCardsRow}>
          {stats.zones.map(z => {
            const pct  = Math.round(((z.total - z.available) / z.total) * 100)
            const free = z.available
            const color = free === 0 ? 'var(--red)' : free <= 2 ? 'var(--amber)' : 'var(--green)'
            return (
              <div key={z.name} className={styles.zoneCard}>
                <div className={styles.zoneCardName}>{z.name}</div>
                <div className={styles.zoneCardCount} style={{ color }}>{free}</div>
                <div className={styles.zoneCardLabel}>slots free</div>
                <div className={styles.progressTrack} style={{ marginTop: 10 }}>
                  <div className={styles.progressFill} style={{
                    width: `${pct}%`,
                    background: pct > 70 ? 'var(--red)' : pct > 40 ? 'var(--amber)' : 'var(--green)'
                  }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  {pct}% occupied
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color, icon, pct }) {
  const colors = { green: 'var(--green)', red: 'var(--red)', amber: 'var(--amber)', blue: 'var(--accent)' }
  return (
    <div className={styles.statCard} style={{ '--accent-c': colors[color] }}>
      <div className={styles.statTop}>
        <span className={styles.statLabel}>{label}</span>
        <span className={styles.statIcon}>{icon}</span>
      </div>
      <div className={styles.statValue}>{value}</div>
      {pct !== undefined && (
        <>
          <div className={styles.progressTrack} style={{ marginTop: 10 }}>
            <div className={styles.progressFill} style={{ width: `${pct}%`, background: colors[color] }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{pct}% of total</div>
        </>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ padding: 0 }}>
      <div style={{ height: 60, marginBottom: 24 }} className="skeleton" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[...Array(4)].map((_, i) => <div key={i} style={{ height: 110 }} className="skeleton" />)}
      </div>
    </div>
  )
}
