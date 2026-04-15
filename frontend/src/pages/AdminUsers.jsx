import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import styles from './AdminUsers.module.css'

const MOCK_USERS = [
  { _id:'1', name:'Rahul Sharma',  email:'rahul@college.edu',   mobile:'+91 98765 43210', role:'student', vehicles:['RJ14 AB 1234'], totalBookings:7,  status:'active' },
  { _id:'2', name:'Priya Mehta',   email:'priya@college.edu',   mobile:'+91 87654 32109', role:'student', vehicles:['MH12 EF 9012'], totalBookings:3,  status:'active' },
  { _id:'3', name:'Prof. R Sharma',email:'rsharma@college.edu', mobile:'+91 76543 21098', role:'faculty', vehicles:['DL01 XY 7890'], totalBookings:42, status:'active' },
  { _id:'4', name:'Amit Kumar',    email:'amit@college.edu',    mobile:'+91 65432 10987', role:'student', vehicles:['RJ14 GH 3456'], totalBookings:12, status:'suspended' },
]

export default function AdminUsers() {
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/users')
      .then(r => setUsers(r.data.users))
      .catch(() => setUsers(MOCK_USERS))
      .finally(() => setLoading(false))
  }, [])

  const removeUser = async (id) => {
    if (!confirm('Remove this user?')) return
    try {
      await api.delete(`/users/${id}`)
    } catch { /* demo */ }
    setUsers(prev => prev.filter(u => u._id !== id))
    toast.success('User removed')
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.vehicles?.some(v => v.toLowerCase().includes(search.toLowerCase()))
  )

  const ROLE_STYLE = { student:'var(--accent)', faculty:'var(--accent2)', admin:'var(--amber)' }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>User Management</h1>
          <p className={styles.subtitle}>{users.length} registered users</p>
        </div>
        <input className={styles.search} placeholder="Search by name, email, or vehicle..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>User</th><th>Contact</th><th>Role</th><th>Vehicle(s)</th><th>Bookings</th><th>Status</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_,i) => (
                <tr key={i}>{[...Array(7)].map((__,j) => <td key={j}><div className="skeleton" style={{ height:18, borderRadius:4 }} /></td>)}</tr>
              ))
            ) : filtered.map(u => (
              <tr key={u._id}>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div className={styles.avatar}>{u.name[0]}</div>
                    <span style={{ fontSize:13, fontWeight:500 }}>{u.name}</span>
                  </div>
                </td>
                <td>
                  <div style={{ fontSize:12 }}>{u.email}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{u.mobile}</div>
                </td>
                <td>
                  <span className={styles.roleBadge} style={{ background:`${ROLE_STYLE[u.role]}22`, color:ROLE_STYLE[u.role] }}>
                    {u.role}
                  </span>
                </td>
                <td>
                  {u.vehicles?.map(v => (
                    <div key={v} className={styles.vehicleTag}>{v}</div>
                  ))}
                </td>
                <td style={{ fontFamily:'var(--font-mono)', fontSize:13 }}>{u.totalBookings}</td>
                <td>
                  <span className={styles.statusBadge} style={{
                    background: u.status==='active' ? 'var(--green-glow)' : 'rgba(255,77,109,0.1)',
                    color:       u.status==='active' ? 'var(--green)'     : 'var(--red)',
                  }}>{u.status}</span>
                </td>
                <td>
                  <button className={styles.removeBtn} onClick={() => removeUser(u._id)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
