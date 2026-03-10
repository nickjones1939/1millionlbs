const css = `
  .pro-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.88); backdrop-filter: blur(8px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .pro-modal { background: #111; border: 1px solid #fbbf2430; border-radius: 18px; padding: 40px 36px; width: 100%; max-width: 460px; position: relative; overflow: hidden; }
  .pro-badge { display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #fbbf24, #f97316); border-radius: 6px; padding: 4px 12px; font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 13px; letter-spacing: 3px; color: #000; margin-bottom: 20px; }
  .pro-feature-row { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-bottom: 1px solid #1a1a1a; }
  .pro-feature-row:last-child { border-bottom: none; }
  .pro-confirm-btn { width: 100%; padding: 16px; background: linear-gradient(135deg, #fbbf24, #f97316); color: #000; border: none; border-radius: 10px; font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 16px; letter-spacing: 3px; cursor: pointer; transition: all 0.2s; box-shadow: 0 0 24px #fbbf2440; margin-top: 24px; }
  .pro-confirm-btn:hover { opacity: 0.9; transform: translateY(-1px); }
  .pro-cancel-btn { width: 100%; padding: 12px; background: none; border: none; color: #444; font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 13px; letter-spacing: 2px; cursor: pointer; margin-top: 10px; }
  .pro-cancel-btn:hover { color: #666; }
`

const FEATURES = [
  {
    icon: '🏆',
    title: 'PUBLIC LEADERBOARD',
    desc: 'Your name and stats appear on the rolling 30-day public leaderboard, visible to everyone on 1millionlbs.com.',
  },
  {
    icon: '📹',
    title: 'PROOF OF WORK',
    desc: 'Record each set directly in the app — no uploads allowed. Videos are stamped with the date and time so there\'s no faking it. All Pro members must film every set.',
  },
  {
    icon: '⚡',
    title: 'CREATE PROOF CHALLENGES',
    desc: 'Start private or public challenges that require video proof from every participant. Free members cannot create proof challenges.',
  },
  {
    icon: '🔒',
    title: 'JOIN PROOF CHALLENGES',
    desc: 'Accept invites to proof-of-work challenges from other Pro members.',
  },
]

export default function ProModal({ onConfirm, onCancel }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="pro-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
        <div className="pro-modal">
          {/* Glow */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'radial-gradient(circle, #fbbf2415, transparent 70%)', pointerEvents: 'none' }} />

          <div className="pro-badge">⚡ GO PRO</div>

          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 28, color: '#fff', letterSpacing: 1, marginBottom: 6, lineHeight: 1.1 }}>
            UPGRADE TO PRO
          </div>
          <div style={{ fontSize: 13, color: '#555', marginBottom: 24 }}>
            $10 / month · Cancel anytime
          </div>

          <div style={{ marginBottom: 8 }}>
            {FEATURES.map(f => (
              <div key={f.title} className="pro-feature-row">
                <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1.3 }}>{f.icon}</span>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 14, color: '#fbbf24', letterSpacing: 2, marginBottom: 3 }}>{f.title}</div>
                  <div style={{ fontSize: 13, color: '#666', lineHeight: 1.55 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#fbbf2408', border: '1px solid #fbbf2425', borderRadius: 10, padding: '12px 16px', marginTop: 16 }}>
            <div style={{ fontSize: 12, color: '#fbbf2480', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 2, marginBottom: 4 }}>WHAT PROOF OF WORK MEANS</div>
            <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
              Every set you log must be filmed live using your phone's camera — no pre-recorded videos allowed. The app opens your camera, records your set, and burns a timestamp onto the video before uploading. This ensures every lb on the leaderboard is real.
            </div>
          </div>

          <button className="pro-confirm-btn" onClick={onConfirm}>
            ACTIVATE PRO — $10/MO
          </button>
          <button className="pro-cancel-btn" onClick={onCancel}>
            STAY FREE
          </button>
        </div>
      </div>
    </>
  )
}
