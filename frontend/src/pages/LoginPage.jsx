import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import styles from './AuthPage.module.css'
import brandingImg from '../pages/Parking.jpg'
import { useGoogleLogin } from '@react-oauth/google'

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.name}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const user = await loginWithGoogle(tokenResponse.access_token)
        toast.success(`Welcome, ${user.name}!`)
        navigate('/dashboard')
      } catch (err) {
        toast.error('Google login failed. Try again.')
      }
    },
    onError: () => toast.error('Google login was cancelled'),
  })

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

        {/* Glass overlay — sits transparently ON the image */}
        <div className={styles.cardBody}>

          <div className={styles.brand}>
            <div className={styles.brandMark}>CPU</div>
            <span className={styles.brandName}>Parking</span>
          </div>

          <h1 className={styles.heading}>Welcome back</h1>
          <p className={styles.sub}>Sign in to your parking account</p>

          {/* ── Google login button ── */}
          <button
            type="button"
            onClick={() => googleLogin()}
            className={styles.googleBtn}
          >
            <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>

          {/* ── Divider ── */}
          <div className={styles.dividerRow}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerText}>or sign in with email</span>
            <div className={styles.dividerLine} />
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label>Email address</label>
              <input
                type="email"
                placeholder="you@park.com"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className={styles.field}>
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                required
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>

            <div className={styles.demoHint}>
              <strong>Ex :</strong> admin@park.com / admin123
              &nbsp;|&nbsp;
              cpustudent@park.com / student123
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : 'Sign In'}
            </button>
          </form>

          <p className={styles.switch}>
            No account? <Link to="/register">Create</Link>
          </p>

        </div>
      </div>
    </div>
  )
}
