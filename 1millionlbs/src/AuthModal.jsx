import { useState } from 'react'

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)



const css = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=Oswald:wght@700&display=swap');
  .auth-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(6px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .auth-modal { background: #111; border: 1px solid #222; border-radius: 16px; padding: 40px 36px; width: 100%; max-width: 420px; }
  .auth-provider-btn { width: 100%; display: flex; align-items: center; gap: 12px; padding: 13px 18px; border-radius: 9px; border: 1px solid #2a2a2a; background: #161616; color: #ccc; font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 14px; letter-spacing: 1px; cursor: pointer; transition: all 0.18s; margin-bottom: 10px; }
  .auth-provider-btn:hover { border-color: #444; color: #fff; background: #1a1a1a; }
  .auth-input { width: 100%; background: #161616; border: 1px solid #2a2a2a; border-radius: 8px; color: #fff; padding: 13px 15px; font-size: 15px; font-family: 'Barlow Condensed', sans-serif; outline: none; transition: border-color 0.2s; margin-bottom: 10px; }
  .auth-input:focus { border-color: #84cc16; }
  .auth-input::placeholder { color: #444; }
  .auth-submit-btn { width: 100%; padding: 14px; background: #84cc16; color: #000; border: none; border-radius: 9px; font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 15px; letter-spacing: 3px; cursor: pointer; transition: all 0.2s; }
  .auth-submit-btn:hover { background: #a3e635; }
  .auth-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .auth-divider { display: flex; align-items: center; gap: 12px; margin: 18px 0; }
  .auth-divider-line { flex: 1; height: 1px; background: #222; }
  .auth-divider-text { font-size: 11px; color: #444; font-family: 'Barlow Condensed', sans-serif; letter-spacing: 2px; }
  .auth-toggle { background: none; border: none; color: #84cc16; font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 13px; cursor: pointer; letter-spacing: 1px; }
  .auth-error { background: #f43f5e15; border: 1px solid #f43f5e40; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #f43f5e; margin-bottom: 14px; }
  .auth-success { background: #84cc1615; border: 1px solid #84cc1640; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #84cc16; margin-bottom: 14px; }
`

export default function AuthModal({ onClose, authHooks }) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = authHooks
  const [mode, setMode]         = useState('signin') // signin | signup
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [loading, setLoading]   = useState(false)

  const handleEmailAuth = async () => {
    if (!email || !password) return
    setLoading(true); setError(''); setSuccess('')
    const fn = mode === 'signin' ? signInWithEmail : signUpWithEmail
    const { error } = await fn(email, password)
    setLoading(false)
    if (error) {
      setError(error.message)
    } else if (mode === 'signup') {
      setSuccess('Check your email to confirm your account!')
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="auth-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="auth-modal">
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #a3e635, #84cc16)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 14, color: '#000' }}>1M</span>
              </div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 20, letterSpacing: 3, background: 'linear-gradient(90deg, #fff 0%, #84cc16 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                LB CLUB
              </div>
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 26, color: '#fff', letterSpacing: 1 }}>
              {mode === 'signin' ? 'WELCOME BACK' : 'JOIN THE CLUB'}
            </div>
            <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>
              {mode === 'signin' ? 'Sign in to save your progress.' : 'Create an account to track your journey.'}
            </div>
          </div>

          {/* OAuth providers */}
          <button className="auth-provider-btn" onClick={signInWithGoogle}>
            <GoogleIcon /> CONTINUE WITH GOOGLE
          </button>

          <div className="auth-divider">
            <div className="auth-divider-line" />
            <span className="auth-divider-text">OR</span>
            <div className="auth-divider-line" />
          </div>

          {/* Email/password */}
          {error   && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <input className="auth-input" type="email" placeholder="Email address"
            value={email} onChange={e => setEmail(e.target.value)} />
          <input className="auth-input" type="password" placeholder="Password"
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleEmailAuth()} />

          <button className="auth-submit-btn" onClick={handleEmailAuth} disabled={loading}>
            {loading ? 'LOADING...' : mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: '#555' }}>
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button className="auth-toggle" onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(''); setSuccess('') }}>
              {mode === 'signin' ? 'SIGN UP' : 'SIGN IN'}
            </button>
          </div>

          {/* Guest option */}
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#444', fontSize: 12, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, cursor: 'pointer' }}>
              CONTINUE AS GUEST →
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
