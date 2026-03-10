import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ProModal from './ProModal'

const medals = ['🥇', '🥈', '🥉']
const medalColors = ['#fbbf24', '#9ca3af', '#b45309']

function ProgressBar({ pct, color = '#84cc16' }) {
  return (
    <div style={{ height: 5, background: '#1a1a1a', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 3, transition: 'width 0.5s ease', boxShadow: `0 0 6px ${color}60` }} />
    </div>
  )
}

export default function PublicLeaderboard({ currentUser, profile, onProUpgrade }) {
  const [entries, setEntries]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(null)
  const [showVideo, setShowVideo] = useState(null)
  const [showProModal, setShowProModal] = useState(false)
  const [togglingPro, setTogglingPro]   = useState(false)

  const isPro    = !!profile?.is_pro
  const isPublic = !!profile?.public_leaderboard

  useEffect(() => { fetchLeaderboard() }, [])

  async function fetchLeaderboard() {
    setLoading(true)
    const cutoff = new Date(Date.now() - 30 * 86400000).toISOString()
    const { data: publicUsers } = await supabase.from('profiles').select('id, display_name').eq('public_leaderboard', true)
    if (!publicUsers?.length) { setEntries([]); setLoading(false); return }
    const leaderboardData = await Promise.all(publicUsers.map(async (u) => {
      const [{ data: workouts }, { data: cardio }, { data: proofs }] = await Promise.all([
        supabase.from('workouts').select('total_lbs').eq('user_id', u.id).gte('logged_at', cutoff),
        supabase.from('cardio_sessions').select('minutes').eq('user_id', u.id).gte('logged_at', cutoff),
        supabase.from('set_proofs').select('video_url, recorded_at').eq('user_id', u.id).gte('created_at', cutoff).order('created_at', { ascending: false }).limit(6),
      ])
      return {
        userId: u.id, name: u.display_name || 'Anonymous',
        totalLbs: (workouts||[]).reduce((s,w)=>s+w.total_lbs,0),
        sessions: (workouts||[]).length,
        cardioMins: (cardio||[]).reduce((s,c)=>s+c.minutes,0),
        proofs: proofs||[], isMe: u.id === currentUser?.id
      }
    }))
    leaderboardData.sort((a,b)=>b.totalLbs-a.totalLbs)
    setEntries(leaderboardData)
    setLoading(false)
  }

  async function handleProConfirm() {
    if (!currentUser) return
    setTogglingPro(true)
    await supabase.from('profiles').update({ is_pro: true, public_leaderboard: true }).eq('id', currentUser.id)
    setShowProModal(false); setTogglingPro(false)
    if (onProUpgrade) onProUpgrade()
    fetchLeaderboard()
  }

  async function handleGoPrivate() {
    setTogglingPro(true)
    await supabase.from('profiles').update({ public_leaderboard: false }).eq('id', currentUser.id)
    setTogglingPro(false)
    if (onProUpgrade) onProUpgrade()
    fetchLeaderboard()
  }

  async function handleGoPublic() {
    setTogglingPro(true)
    await supabase.from('profiles').update({ public_leaderboard: true }).eq('id', currentUser.id)
    setTogglingPro(false)
    if (onProUpgrade) onProUpgrade()
    fetchLeaderboard()
  }

  const top = entries[0]?.totalLbs || 1

  return (
    <div className="fade-up">
      {showProModal && <ProModal onConfirm={handleProConfirm} onCancel={() => setShowProModal(false)} />}

      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 40, color: '#fff', letterSpacing: 2, lineHeight: 1, marginBottom: 6 }}>LEADERBOARD</div>
      <div style={{ fontSize: 14, color: '#555', marginBottom: 28 }}>Rolling 30-day total · Proof of work verified · Pro members only.</div>

      {/* Pro toggle card */}
      {currentUser && (
        <div style={{ background: '#111', border: `1px solid ${isPro&&isPublic?'#fbbf2435':'#1e1e1e'}`, borderRadius: 14, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            {isPro && isPublic ? <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ background: 'linear-gradient(135deg,#fbbf24,#f97316)', borderRadius: 4, padding: '2px 8px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 11, letterSpacing: 2, color: '#000' }}>⚡ PRO</div>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: '#fbbf24', letterSpacing: 1 }}>YOU'RE ON THE LEADERBOARD</span>
              </div>
              <div style={{ fontSize: 12, color: '#555' }}>Your stats are public. All sets require video proof of work.</div>
            </> : isPro && !isPublic ? <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ background: 'linear-gradient(135deg,#fbbf24,#f97316)', borderRadius: 4, padding: '2px 8px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 11, letterSpacing: 2, color: '#000' }}>⚡ PRO</div>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: '#888', letterSpacing: 1 }}>PRIVATE MODE</span>
              </div>
              <div style={{ fontSize: 12, color: '#555' }}>You're Pro but hidden from the leaderboard.</div>
            </> : <>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: '#555', letterSpacing: 1, marginBottom: 4 }}>🔒 PRIVATE MODE</div>
              <div style={{ fontSize: 12, color: '#444' }}>Upgrade to Pro to appear on the public leaderboard.</div>
            </>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {isPro && isPublic && <button onClick={handleGoPrivate} disabled={togglingPro} style={{ padding: '10px 18px', background: '#161616', border: '1px solid #2a2a2a', borderRadius: 8, color: '#555', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 2, cursor: 'pointer' }}>GO PRIVATE</button>}
            {isPro && !isPublic && <button onClick={handleGoPublic} disabled={togglingPro} style={{ padding: '10px 18px', background: '#fbbf2415', border: '1px solid #fbbf2440', borderRadius: 8, color: '#fbbf24', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 2, cursor: 'pointer' }}>GO PUBLIC</button>}
            {!isPro && <button onClick={() => setShowProModal(true)} style={{ padding: '10px 20px', background: 'linear-gradient(135deg,#fbbf24,#f97316)', border: 'none', borderRadius: 8, color: '#000', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 13, letterSpacing: 2, cursor: 'pointer', boxShadow: '0 0 16px #fbbf2430' }}>⚡ GO PRO — $10/MO</button>}
          </div>
        </div>
      )}

      {!currentUser && (
        <div style={{ background: '#fbbf2408', border: '1px solid #fbbf2420', borderRadius: 14, padding: '20px 24px', marginBottom: 24 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: '#fbbf24', letterSpacing: 1, marginBottom: 4 }}>⚡ WANT TO COMPETE?</div>
          <div style={{ fontSize: 12, color: '#555' }}>Sign in and upgrade to Pro to appear on the leaderboard.</div>
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#444', fontSize: 13 }}>
          <div style={{ width: 20, height: 20, border: '2px solid #fbbf2430', borderTop: '2px solid #fbbf24', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          Loading leaderboard...
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 14, padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 22, color: '#fff', marginBottom: 8 }}>NO PRO MEMBERS YET</div>
          <div style={{ fontSize: 13, color: '#444' }}>Be the first to go Pro and claim the #1 spot.</div>
        </div>
      )}

      {!loading && entries.length > 0 && (
        <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 24px', background: '#141414', borderBottom: '1px solid #1e1e1e', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, letterSpacing: 3, color: '#444', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>TOP LIFTERS — LAST 30 DAYS</span>
            <span style={{ fontSize: 10, letterSpacing: 2, color: '#fbbf2460', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>{entries.length} PRO MEMBERS</span>
          </div>
          {entries.map((entry, i) => (
            <div key={entry.userId}
              style={{ padding: '20px 24px', borderBottom: '1px solid #161616', background: entry.isMe?'#fbbf2406':'transparent', cursor: 'pointer', transition: 'background 0.15s' }}
              onClick={() => setSelected(selected?.userId===entry.userId ? null : entry)}
              onMouseEnter={e=>{ if(!entry.isMe) e.currentTarget.style.background='#161616' }}
              onMouseLeave={e=>{ if(!entry.isMe) e.currentTarget.style.background='transparent' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                <span style={{ fontSize: 22, width: 32, textAlign: 'center', flexShrink: 0 }}>
                  {i<3 ? medals[i] : <span style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 16, color: '#444' }}>#{i+1}</span>}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 17, color: entry.isMe?'#fbbf24':'#ccc', letterSpacing: 1 }}>{entry.name.toUpperCase()}</span>
                      <span style={{ background: 'linear-gradient(135deg,#fbbf24,#f97316)', borderRadius: 4, padding: '1px 6px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 9, letterSpacing: 2, color: '#000' }}>PRO</span>
                      {entry.isMe && <span style={{ fontSize: 11, color: '#fbbf2460' }}>(YOU)</span>}
                    </div>
                    <span style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 22, color: i<3?medalColors[i]:'#666' }}>
                      {entry.totalLbs.toLocaleString()} <span style={{ fontSize: 12, color: '#333' }}>LBS</span>
                    </span>
                  </div>
                  <ProgressBar pct={(entry.totalLbs/top)*100} color={i===0?'#fbbf24':i===1?'#9ca3af':i===2?'#cd7c2d':'#84cc16'} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 24, marginLeft: 46 }}>
                <div><div style={{ fontSize: 9, letterSpacing: 2, color: '#444', fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 2 }}>SESSIONS</div><div style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 15, color: '#888' }}>{entry.sessions}</div></div>
                <div><div style={{ fontSize: 9, letterSpacing: 2, color: '#444', fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 2 }}>CARDIO MINS</div><div style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 15, color: '#38bdf8' }}>{entry.cardioMins}</div></div>
                <div>
                  <div style={{ fontSize: 9, letterSpacing: 2, color: '#444', fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 2 }}>PROOF OF WORK</div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: entry.proofs.length>0?'#f97316':'#333' }}>
                    {entry.proofs.length>0 ? (currentUser?`${entry.proofs.length} VIDEOS ▾`:'🔒 LOGIN TO VIEW') : 'NO VIDEOS YET'}
                  </div>
                </div>
              </div>
              {selected?.userId===entry.userId && currentUser && entry.proofs.length>0 && (
                <div style={{ marginTop: 16, marginLeft: 46 }}>
                  <div style={{ fontSize: 10, letterSpacing: 3, color: '#f9731660', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, marginBottom: 10 }}>RECENT SETS</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {entry.proofs.map((proof, pi) => (
                      <div key={pi} style={{ position: 'relative', width: 90, height: 130, borderRadius: 8, overflow: 'hidden', background: '#0d0d0d', border: '1px solid #2a2a2a', cursor: 'pointer', flexShrink: 0 }}
                        onClick={e=>{ e.stopPropagation(); setShowVideo(proof.video_url) }}>
                        <video src={proof.video_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: '2px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: 0, height: 0, borderStyle: 'solid', borderWidth: '5px 0 5px 9px', borderColor: 'transparent transparent transparent #fff', marginLeft: 2 }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selected?.userId===entry.userId && !currentUser && entry.proofs.length>0 && (
                <div style={{ marginTop: 12, marginLeft: 46, padding: '11px 14px', background: '#f9731610', border: '1px solid #f9731625', borderRadius: 8, fontSize: 13, color: '#f97316', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: 1 }}>
                  🔒 SIGN IN TO VIEW PROOF OF WORK VIDEOS
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showVideo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.96)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={()=>setShowVideo(null)}>
          <video src={showVideo} controls autoPlay style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 12 }} onClick={e=>e.stopPropagation()} />
          <button onClick={()=>setShowVideo(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 2, padding: '8px 16px', cursor: 'pointer' }}>✕ CLOSE</button>
        </div>
      )}
    </div>
  )
}
