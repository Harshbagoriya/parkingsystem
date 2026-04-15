import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import styles from './AuthPage.module.css'
import brandingImg from '../pages/parking.jpg'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate     = useNavigate()
  const [form, setForm]     = useState({ name: '', email: '', mobile: '', password: '', role: 'student' })
  const [loading, setLoading] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created! Welcome to ParkSmart.')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.bg}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className={styles.bgShape} style={{ '--i': i }} />
        ))}
      </div>

      <div className={styles.card}>

        {/* College image — fills entire card as background */}
        <img
          src={brandingImg}
          alt="Career Point University"
          className={styles.cardImage}
        />

        {/* Glass overlay — form sits transparently ON the image */}
        <div className={styles.cardBody}>

          <div className={styles.brand}>
            <div className={styles.brandMark}>CPU</div>
            <span className={styles.brandName}>Parking</span>
          </div>

          <h1 className={styles.heading}>Create account</h1>
          <p className={styles.sub}>Register to access college parking</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.twoCol}>
              <div className={styles.field}>
                <label>Full Name</label>
                <input placeholder="Rahul Sharma" required value={form.name} onChange={set('name')} />
              </div>
              <div className={styles.field}>
                <label>Role</label>
                <select value={form.role} onChange={set('role')}>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <label>Email</label>
              <input type="email" placeholder="you@college.edu" required value={form.email} onChange={set('email')} />
            </div>

            <div className={styles.field}>
              <label>Mobile</label>
              <input type="tel" placeholder="+91 98765 43210" value={form.mobile} onChange={set('mobile')} />
            </div>

            <div className={styles.field}>
              <label>Password</label>
              <input type="password" placeholder="Min 6 characters" required minLength={6} value={form.password} onChange={set('password')} />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : 'Create Account'}
            </button>
          </form>

          <p className={styles.switch}>
            Already registered? <Link to="/login">Sign in</Link>
          </p>

        </div>
      </div>
    </div>
  )
}
