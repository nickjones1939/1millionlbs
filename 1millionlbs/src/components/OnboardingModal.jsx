import { useState } from 'react'

const css = `
  .onboard-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); backdrop-filter: blur(8px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .onboard-modal { background: #111; border: 1px solid #222; border-radius: 16px; padding: 44px 40px; width: 100%; max-width: 400px; text-align: center; }
  .onboard-input { width: 100%; background: #161616; border: 1px solid #2a2a2a; border-radius: 8px; color: #fff; padding: 14px 16px; font-size: 22px; font-family: 'Barlow Condensed', sans-serif; font-weight: 700; letter-spacing: 2px; outline: none; transition: border-color 0.2s; text-align: center; margin: 20px 0; }
  .onboard-input:focus { border-color: #84cc16; }
  .onboard-input::placeholder { color: #333; }
  .onboard-btn { width: 100%; padding: 15px; background: #84cc16; color: #000; border: none; border-radius: 9px; font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 16px; letter-spacing: 4px; cursor: pointer; transition: all 0.2s; }
  .onboard-btn:hover { background: #a3e635; }
  .onboard-btn:disabled { opacity: 0.4; cursor: not-allowed; }
`

export default function OnboardingModal({ user, saveProfile }) {
  const [name, setName]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const handleSave = async () => {
    if (!name.trim()) return
    setLoading(true); setError('')
    const { error } = await saveProfile(user.id, name.trim())
    if (error) { setError(error.message); setLoading(false) }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="onboard-overlay">
        <div className="onboard-modal">
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏋️</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 28, color: '#fff', letterSpacing: 2, marginBottom: 8 }}>
            YOU'RE IN THE CLUB
          </div>
          <div style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>
            What should we call you?<br/>This will show on your profile.
          </div>

          <input
            className="onboard-input"
            placeholder="YOUR NAME"
            value={name}
            maxLength={24}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus
          />

          {error && (
            <div style={{ background: '#f43f5e15', border: '1px solid #f43f5e40', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f43f5e', marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button className="onboard-btn" onClick={handleSave} disabled={loading || !name.trim()}>
            {loading ? 'SAVING...' : "LET'S GO →"}
          </button>
        </div>
      </div>
    </>
  )
}
