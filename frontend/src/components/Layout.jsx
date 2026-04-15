import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Layout.module.css'

const NAV_USER = [
  { to: '/dashboard',   icon: '⬡', label: 'Dashboard' },
  { to: '/parking-map', icon: '⊞', label: 'Parking Map' },
  { to: '/book',        icon: '＋', label: 'Book Slot' },
  { to: '/my-bookings', icon: '≡', label: 'My Bookings' },
]
const NAV_ADMIN = [
  { to: '/entry-exit',   icon: '⟷', label: 'Entry / Exit' },
  { to: '/admin/users',  icon: '◎', label: 'Users' },
  { to: '/admin/slots',  icon: '⚙', label: 'Manage Slots' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className={`${styles.shell} ${collapsed ? styles.collapsed : ''}`}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>CPU</div>
          {!collapsed && <span className={styles.logoText}>Parking</span>}
        </div>

        <nav className={styles.nav}>
          <div className={styles.navSection}>{!collapsed && 'Navigation'}</div>
          {NAV_USER.map(n => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }>
              <span className={styles.navIcon}>{n.icon}</span>
              {!collapsed && <span>{n.label}</span>}
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <>
              <div className={styles.navSection}>{!collapsed && 'Admin'}</div>
              {NAV_ADMIN.map(n => (
                <NavLink key={n.to} to={n.to} className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ''}`
                }>
                  <span className={styles.navIcon}>{n.icon}</span>
                  {!collapsed && <span>{n.label}</span>}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userCard}>
            <div className={styles.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
            {!collapsed && (
              <div className={styles.userInfo}>
                <div className={styles.userName}>{user?.name}</div>
                <div className={styles.userRole}>{user?.role}</div>
              </div>
            )}
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">⏻</button>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        <header className={styles.topbar}>
          <button className={styles.collapseBtn} onClick={() => setCollapsed(c => !c)}>
            {collapsed ? '›' : '‹'}
          </button>
         
        </header>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
