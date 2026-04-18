import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import Layout       from './components/Layout'
import LoginPage    from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import Dashboard    from './pages/Dashboard'
import ParkingMap   from './pages/ParkingMap'
import BookSlot     from './pages/BookSlot'
import MyBookings   from './pages/MyBookings'
import EntryExit    from './pages/EntryExit'
import AdminUsers   from './pages/AdminUsers'
import AdminSlots   from './pages/AdminSlots'
import NotFound     from './pages/NotFound'

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

function PublicRoute({ children }) {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Protected */}
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"     element={<Dashboard />} />
          <Route patimport { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import Layout        from './components/Layout'
import LoginPage     from './pages/LoginPage'
import RegisterPage  from './pages/RegisterPage'
import Dashboard     from './pages/Dashboard'
import ParkingMap    from './pages/ParkingMap'
import BookSlot      from './pages/BookSlot'
import MyBookings    from './pages/MyBookings'
import EntryExit     from './pages/EntryExit'
import AdminUsers    from './pages/AdminUsers'
import AdminSlots    from './pages/AdminSlots'
import AdminReserve  from './pages/AdminReserve'
import NotFound      from './pages/NotFound'

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

function PublicRoute({ children }) {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Protected */}
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"          element={<Dashboard />} />
          <Route path="parking-map"        element={<ParkingMap />} />
          <Route path="book"               element={<BookSlot />} />
          <Route path="my-bookings"        element={<MyBookings />} />
          <Route path="entry-exit"         element={<PrivateRoute adminOnly><EntryExit /></PrivateRoute>} />
          <Route path="admin/users"        element={<PrivateRoute adminOnly><AdminUsers /></PrivateRoute>} />
          <Route path="admin/slots"        element={<PrivateRoute adminOnly><AdminSlots /></PrivateRoute>} />
          <Route path="admin/reserve"      element={<PrivateRoute adminOnly><AdminReserve /></PrivateRoute>} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}h="parking-map"   element={<ParkingMap />} />
          <Route path="book"          element={<BookSlot />} />
          <Route path="my-bookings"   element={<MyBookings />} />
          <Route path="entry-exit"    element={<PrivateRoute adminOnly><EntryExit /></PrivateRoute>} />
          <Route path="admin/users"   element={<PrivateRoute adminOnly><AdminUsers /></PrivateRoute>} />
          <Route path="admin/slots"   element={<PrivateRoute adminOnly><AdminSlots /></PrivateRoute>} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}
