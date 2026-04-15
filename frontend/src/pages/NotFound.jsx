import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--bg-base)', textAlign:'center', gap:16 }}>
      <div style={{ fontSize:80, fontFamily:'var(--font-display)', fontWeight:800, color:'var(--border-strong)', lineHeight:1 }}>404</div>
      <h1 style={{ fontFamily:'var(--font-display)', fontSize:22 }}>Page not found</h1>
      <p style={{ color:'var(--text-muted)', fontSize:14 }}>The page you're looking for doesn't exist.</p>
      <Link to="/dashboard" style={{ background:'var(--accent)', color:'#fff', borderRadius:10, padding:'10px 24px', fontWeight:600, fontSize:14, textDecoration:'none', marginTop:8 }}>Go to Dashboard</Link>
    </div>
  )
}
