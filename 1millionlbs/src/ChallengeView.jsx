import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ProModal from './ProModal'

const TARGET = 1_000_000

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

const css = `
  .ch-input { width: 100%; background: #161616; border: 1px solid #2a2a2a; border-radius: 8px; color: #fff; padding: 13px 15px; font-size: 15px; font-family: 'Barlow Condensed', sans-serif; font-weight: 700; letter-spacing: 2px; outline: none; transition: border-color 0.2s; }
  .ch-input:focus { border-color: #f97316; }
  .ch-input::placeholder { color: #333; }
  .ch-btn { padding: 13px 24px; border-radius: 9px; font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 14px; letter-spacing: 3px; cursor: pointer; transition: all 0.2s; border: none; }
  .ch-btn-orange { background: #f97316; color: #000; }
  .ch-btn-orange:hover { background: #fb923c; }
  .ch-btn-outline { background: #161616; color: #f97316; border: 1.5px solid #f97316; }
  .ch-btn-outline:hover { background: #f9731615; }
  .ch-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .copy-btn { background: #161616; border: 1px solid #2a2a2a; border-radius: 6px; color: #888; font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 11px; letter-spacing: 2px; padding: 6px 12px; cursor: pointer; transition: all 0.18s; }
  .copy-btn:hover { border-color: #f97316; color: #f97316; }
  .seg-btn { flex: 1; padding: 11px; border: 1px solid #2a2a2a; background: #0d0d0d; color: #555; font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 13px; letter-spacing: 2px; cursor: pointer; transition: all 0.18s; }
  .seg-btn.active-pub { background: #f9731618; border-color: #f9731640; color: #f97316; }
  .seg-btn.active-priv { background: #84cc1612; border-color: #84cc1640; color: #84cc16; }
  .seg-btn:first-child { border-radius: 8px 0 0 8px; border-right: none; }
  .seg-btn:last-child { border-radius: 0 8px 8px 0; }
  .toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
  .toggle-pill { width: 44px; height: 24px; border-radius: 12px; position: relative; transition: background 0.2s; flex-shrink: 0; }
  .toggle-thumb { position: absolute; top: 2px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: left 0.2s; box-shadow: 0 1px 4px #00000060; }
`

function Toggle({ on, color = '#f97316' }) {
  return (
    <div className="toggle-pill" style={{ background: on ? color : '#2a2a2a' }}>
      <div className="toggle-thumb" style={{ left: on ? 22 : 2 }} />
    </div>
  )
}

function ProgressBar({ pct, color = '#f97316' }) {
  return (
    <div style={{ height: 6, background: '#1a1a1a', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 3, transition: 'width 0.5s ease', boxShadow: `0 0 6px ${color}60` }} />
    </div>
  )
}

function ProGate({ onUpgrade }) {
  return (
    <div style={{ background: '#fbbf2408', border: '1px solid #fbbf2425', borderRadius: 12, padding: '20px 22px', marginBottom: 20 }}>
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 15, color: '#fbbf24', letterSpacing: 2, marginBottom: 6 }}>⚡ PRO REQUIRED</div>
      <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 14 }}>
        Creating or joining proof-of-work challenges requires a Pro membership ($10/mo). Proof of work means every set must be filmed live on camera with a timestamp — no faking it.
      </div>
      <button onClick={onUpgrade} style={{ padding: '11px 22px', background: 'linear-gradient(135deg,#fbbf24,#f97316)', border: 'none', borderRadius: 8, color: '#000', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 13, letterSpacing: 2, cursor: 'pointer' }}>
        UPGRADE TO PRO
      </button>
    </div>
  )
}

const medals = ['🥇', '🥈', '🥉']
const medalColors = ['#fbbf24', '#9ca3af', '#b45309']

export default function ChallengeView({ user, profile, userTotalLbs, userSessions, userCardioMins }) {
  const [tab, setTab]               = useState('browse')
  const [myChallenge, setMyChallenge] = useState(null)
  const [joinedChallenges, setJoinedChallenges] = useState([])
  const [activeChallengeId, setActiveChallengeId] = useState(null)
  const [activeChallenge, setActiveChallenge]     = useState(null)
  const [leaderboard, setLeaderboard] = useState([])

  // Create form state
  const [challengeName, setChallengeName] = useState('')
  const [visibility, setVisibility]       = useState('private') // 'public' | 'private'
  const [honourSystem, setHonourSystem]   = useState('honour')  // 'honour' | 'proof' (only for private)

  // Join state
  const [joinCode, setJoinCode] = useState('')

  const [loading, setLoading]         = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError]             = useState('')
  const [copied, setCopied]           = useState('')
  const [showProModal, setShowProModal] = useState(false)

  const isPro = !!profile?.is_pro

  // Derived: is proof required for the current create form?
  const proofRequired = visibility === 'private' && honourSystem === 'proof'

  useEffect(() => { if (user) fetchMyChallenges() }, [user])
  useEffect(() => { if (activeChallengeId) fetchLeaderboard(activeChallengeId) }, [activeChallengeId])

  async function fetchMyChallenges() {
    setLoadingData(true)
    const { data: created } = await supabase.from('challenges').select('*').eq('created_by', user.id).order('created_at', { ascending: false }).limit(1)
    if (created?.length) setMyChallenge(created[0])

    const { data: memberships } = await supabase.from('challenge_members').select('*, challenges(*)').eq('user_id', user.id)
    if (memberships?.length) {
      setJoinedChallenges(memberships.map(m => m.challenges).filter(Boolean))
      setActiveChallengeId(memberships[0].challenge_id)
      setTab('view')
    } else if (created?.length) {
      setActiveChallengeId(created[0].id)
      setTab('view')
    }
    setLoadingData(false)
  }

  async function fetchLeaderboard(challengeId) {
    const { data: members } = await supabase.from('challenge_members').select('user_id, profiles(display_name)').eq('challenge_id', challengeId)
    if (!members?.length) return

    const leaderboardData = await Promise.all(members.map(async (m) => {
      const [{ data: workouts }, { data: cardio }] = await Promise.all([
        supabase.from('workouts').select('total_lbs').eq('user_id', m.user_id),
        supabase.from('cardio_sessions').select('minutes').eq('user_id', m.user_id),
      ])
      return {
        userId: m.user_id,
        name: m.profiles?.display_name || 'Anonymous',
        totalLbs: (workouts||[]).reduce((s,w)=>s+w.total_lbs,0),
        sessions: (workouts||[]).length,
        cardioMins: (cardio||[]).reduce((s,c)=>s+c.minutes,0),
        pct: Math.min(((workouts||[]).reduce((s,w)=>s+w.total_lbs,0)/TARGET)*100,100),
        isMe: m.user_id === user.id,
      }
    }))
    leaderboardData.sort((a,b)=>b.totalLbs-a.totalLbs)
    setLeaderboard(leaderboardData)

    const { data: challenge } = await supabase.from('challenges').select('*').eq('id', challengeId).single()
    if (challenge) setActiveChallenge(challenge)
  }

  async function handleCreate() {
    if (!challengeName.trim()) return
    // Gate: public challenges require Pro. Private + proof also requires Pro.
    if ((visibility === 'public' || proofRequired) && !isPro) {
      setShowProModal(true)
      return
    }
    setLoading(true); setError('')
    const code = generateCode()
    const { data: challenge, error: err } = await supabase.from('challenges')
      .insert({ name: challengeName.trim(), code, created_by: user.id, target_lbs: TARGET, proof_required: proofRequired, is_public: visibility === 'public' })
      .select().single()
    if (err) { setError(err.message); setLoading(false); return }
    await supabase.from('challenge_members').insert({ challenge_id: challenge.id, user_id: user.id })
    setMyChallenge(challenge)
    setActiveChallengeId(challenge.id)
    setLoading(false)
    setTab('view')
    fetchLeaderboard(challenge.id)
  }

  async function handleJoin() {
    if (!joinCode.trim()) return
    setLoading(true); setError('')
    const { data: challenge } = await supabase.from('challenges').select('*').eq('code', joinCode.trim().toUpperCase()).single()
    if (!challenge) { setError('Challenge not found. Check the code and try again.'); setLoading(false); return }

    // Gate: proof-required challenges require Pro
    if (challenge.proof_required && !isPro) {
      setError('')
      setLoading(false)
      setShowProModal(true)
      return
    }

    const { data: existing } = await supabase.from('challenge_members').select('id').eq('challenge_id', challenge.id).eq('user_id', user.id).single()
    if (!existing) await supabase.from('challenge_members').insert({ challenge_id: challenge.id, user_id: user.id })
    setActiveChallengeId(challenge.id)
    setLoading(false); setJoinCode('')
    setTab('view')
    fetchLeaderboard(challenge.id)
  }

  function copyToClipboard(text, key) {
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(''), 2000) })
  }

  const challengeUrl = activeChallenge ? `${window.location.origin}?challenge=${activeChallenge.code}` : ''

  if (!user) return (
    <div style={{ maxWidth: 500 }}>
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 40, color: '#fff', letterSpacing: 2, marginBottom: 6 }}>CHALLENGES</div>
      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 14, padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 8 }}>SIGN IN TO CHALLENGE FRIENDS</div>
        <div style={{ fontSize: 13, color: '#555' }}>Create or join a challenge to compete with your crew.</div>
      </div>
    </div>
  )

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {showProModal && <ProModal onConfirm={async () => { setShowProModal(false) }} onCancel={() => setShowProModal(false)} />}

      <div className="fade-up">
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 40, color: '#fff', letterSpacing: 2, lineHeight: 1, marginBottom: 6 }}>CHALLENGES</div>
        <div style={{ fontSize: 14, color: '#555', marginBottom: 28 }}>Race your crew to 1,000,000 lbs. First one there wins.</div>

        {/* Tab nav */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid #1e1e1e' }}>
          {(activeChallenge || myChallenge) && (
            <button onClick={() => setTab('view')} style={{ background: 'none', border: 'none', borderBottom: tab==='view'?'2px solid #f97316':'2px solid transparent', color: tab==='view'?'#f97316':'#555', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 2, padding: '8px 16px', cursor: 'pointer' }}>LEADERBOARD</button>
          )}
          <button onClick={() => setTab('create')} style={{ background: 'none', border: 'none', borderBottom: tab==='create'?'2px solid #f97316':'2px solid transparent', color: tab==='create'?'#f97316':'#555', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 2, padding: '8px 16px', cursor: 'pointer' }}>CREATE</button>
          <button onClick={() => setTab('join')} style={{ background: 'none', border: 'none', borderBottom: tab==='join'?'2px solid #f97316':'2px solid transparent', color: tab==='join'?'#f97316':'#555', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 2, padding: '8px 16px', cursor: 'pointer' }}>JOIN</button>
        </div>

        {/* ── CREATE TAB ── */}
        {tab === 'create' && (
          <div style={{ maxWidth: 500 }}>
            <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 14, padding: '30px 32px' }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: '#f9731680', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, marginBottom: 18 }}>NEW CHALLENGE</div>

              {/* Name */}
              <div style={{ fontSize: 10, letterSpacing: 2, color: '#444', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, marginBottom: 8 }}>CHALLENGE NAME</div>
              <input className="ch-input" placeholder="e.g. THE BOYS · WINTER 2026" value={challengeName} onChange={e=>setChallengeName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleCreate()} style={{ marginBottom: 24 }} />

              {/* Public / Private segmented */}
              <div style={{ fontSize: 10, letterSpacing: 2, color: '#444', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, marginBottom: 10 }}>WHO CAN JOIN?</div>
              <div style={{ display: 'flex', marginBottom: 10 }}>
                <button className={`seg-btn${visibility==='public'?' active-pub':''}`} onClick={()=>setVisibility('public')}>🌍 PUBLIC</button>
                <button className={`seg-btn${visibility==='private'?' active-priv':''}`} onClick={()=>setVisibility('private')}>🔒 PRIVATE</button>
              </div>
              <div style={{ fontSize: 12, color: '#444', marginBottom: 20, paddingLeft: 2 }}>
                {visibility==='public'
                  ? 'Anyone with an account can find and join this challenge. Requires Pro membership to create.'
                  : 'Only people with your invite code or link can join.'}
              </div>

              {/* Proof of work — only shown for private */}
              {visibility === 'private' && (
                <>
                  <div style={{ fontSize: 10, letterSpacing: 2, color: '#444', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, marginBottom: 10 }}>VERIFICATION</div>
                  <div className="toggle-row" style={{ background: honourSystem==='honour'?'#84cc1610':'#0d0d0d', border: `1px solid ${honourSystem==='honour'?'#84cc1635':'#1e1e1e'}`, marginBottom: 8 }}
                    onClick={()=>setHonourSystem('honour')}>
                    <div>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: honourSystem==='honour'?'#84cc16':'#888', letterSpacing: 1 }}>🤝 HONOUR SYSTEM</div>
                      <div style={{ fontSize: 12, color: '#444', marginTop: 2 }}>Trust your crew. No video required.</div>
                    </div>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${honourSystem==='honour'?'#84cc16':'#2a2a2a'}`, background: honourSystem==='honour'?'#84cc16':'transparent', transition: 'all 0.2s', flexShrink: 0 }} />
                  </div>
                  <div className="toggle-row" style={{ background: honourSystem==='proof'?'#f9731610':'#0d0d0d', border: `1px solid ${honourSystem==='proof'?'#f9731640':'#1e1e1e'}`, marginBottom: 20 }}
                    onClick={()=>setHonourSystem('proof')}>
                    <div style={{ flex: 1, paddingRight: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: honourSystem==='proof'?'#f97316':'#888', letterSpacing: 1 }}>📹 PROOF OF WORK</span>
                        <span style={{ background: 'linear-gradient(135deg,#fbbf24,#f97316)', borderRadius: 4, padding: '1px 6px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 9, letterSpacing: 2, color: '#000' }}>PRO</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#444', lineHeight: 1.5 }}>
                        Every set must be filmed live on camera. The app opens your camera, records the set, and burns a date + time stamp onto the video. No pre-recorded clips allowed. Requires Pro for all participants.
                      </div>
                    </div>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${honourSystem==='proof'?'#f97316':'#2a2a2a'}`, background: honourSystem==='proof'?'#f97316':'transparent', transition: 'all 0.2s', flexShrink: 0 }} />
                  </div>
                </>
              )}

              {/* Pro gate warning for public */}
              {visibility === 'public' && !isPro && (
                <div style={{ background: '#fbbf2408', border: '1px solid #fbbf2420', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: '#fbbf2480', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>⚡ PRO REQUIRED</div>
                  <div style={{ fontSize: 12, color: '#555' }}>Creating public challenges requires a Pro membership ($10/mo).</div>
                </div>
              )}

              {/* Pro gate warning for proof */}
              {proofRequired && !isPro && (
                <div style={{ background: '#fbbf2408', border: '1px solid #fbbf2420', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: '#fbbf2480', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>⚡ PRO REQUIRED</div>
                  <div style={{ fontSize: 12, color: '#555' }}>Proof of work challenges require Pro for the creator and all participants.</div>
                </div>
              )}

              {error && <div style={{ background: '#f43f5e15', border: '1px solid #f43f5e40', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f43f5e', marginBottom: 14 }}>{error}</div>}

              <button className="ch-btn ch-btn-orange" onClick={handleCreate} disabled={loading || !challengeName.trim()} style={{ width: '100%' }}>
                {loading ? 'CREATING...' : 'CREATE CHALLENGE →'}
              </button>
            </div>
          </div>
        )}

        {/* ── JOIN TAB ── */}
        {tab === 'join' && (
          <div style={{ maxWidth: 480 }}>
            <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 14, padding: '30px 32px' }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: '#f9731680', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, marginBottom: 18 }}>JOIN A CHALLENGE</div>
              <div style={{ fontSize: 10, letterSpacing: 2, color: '#444', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, marginBottom: 8 }}>ENTER CODE</div>
              <input className="ch-input" placeholder="e.g. ABC123" value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} onKeyDown={e=>e.key==='Enter'&&handleJoin()}
                style={{ marginBottom: 16, fontSize: 28, textAlign: 'center', letterSpacing: 8 }} />

              <div style={{ background: '#fbbf2408', border: '1px solid #fbbf2420', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6 }}>
                  <span style={{ color: '#fbbf2480', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: 1 }}>NOTE: </span>
                  If this is a proof-of-work challenge, you'll need a Pro membership to join. Proof means filming every set live on camera — no uploads.
                </div>
              </div>

              {error && <div style={{ background: '#f43f5e15', border: '1px solid #f43f5e40', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f43f5e', marginBottom: 14 }}>{error}</div>}
              <button className="ch-btn ch-btn-orange" onClick={handleJoin} disabled={loading || !joinCode.trim()} style={{ width: '100%' }}>
                {loading ? 'JOINING...' : 'JOIN CHALLENGE →'}
              </button>
            </div>
          </div>
        )}

        {/* ── LEADERBOARD TAB ── */}
        {tab === 'view' && activeChallenge && (
          <div style={{ maxWidth: 680 }}>
            {/* Challenge header */}
            <div style={{ background: '#111', border: '1px solid #f9731625', borderRadius: 14, padding: '24px 28px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ fontSize: 10, letterSpacing: 3, color: '#f9731680', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>
                      {activeChallenge.is_public ? '🌍 PUBLIC' : '🔒 PRIVATE'} CHALLENGE
                    </div>
                    {activeChallenge.proof_required && (
                      <div style={{ background: '#f9731620', border: '1px solid #f9731640', borderRadius: 4, padding: '2px 8px', fontSize: 10, color: '#f97316', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: 2 }}>📹 PROOF REQUIRED</div>
                    )}
                    {!activeChallenge.proof_required && (
                      <div style={{ background: '#84cc1615', border: '1px solid #84cc1630', borderRadius: 4, padding: '2px 8px', fontSize: 10, color: '#84cc16', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: 2 }}>🤝 HONOUR SYSTEM</div>
                    )}
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 26, color: '#fff', letterSpacing: 1 }}>{activeChallenge.name}</div>
                  <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>First to 1,000,000 lbs wins 🏆</div>
                </div>
                {/* Invite code — only for private */}
                {!activeChallenge.is_public && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 14px' }}>
                      <span style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 22, color: '#f97316', letterSpacing: 4 }}>{activeChallenge.code}</span>
                      <button className="copy-btn" onClick={()=>copyToClipboard(activeChallenge.code,'code')}>{copied==='code'?'✓ COPIED':'COPY CODE'}</button>
                    </div>
                    <button className="copy-btn" onClick={()=>copyToClipboard(challengeUrl,'url')} style={{ width: '100%', padding: '8px 14px' }}>
                      {copied==='url'?'✓ LINK COPIED':'🔗 COPY INVITE LINK'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Leaderboard */}
            <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', background: '#141414', borderBottom: '1px solid #1e1e1e' }}>
                <span style={{ fontSize: 10, letterSpacing: 3, color: '#444', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>LEADERBOARD — {leaderboard.length} COMPETITORS</span>
              </div>
              {leaderboard.length === 0 && <div style={{ padding: '32px', textAlign: 'center', color: '#444', fontSize: 13 }}>Waiting for members to join...</div>}
              {leaderboard.map((entry, i) => (
                <div key={entry.userId} style={{ padding: '20px 24px', borderBottom: '1px solid #161616', background: entry.isMe?'#f9731608':'transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                    <span style={{ fontSize: 22, width: 28, textAlign: 'center' }}>{i<3?medals[i]:`#${i+1}`}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16, color: entry.isMe?'#f97316':'#ccc', letterSpacing: 1 }}>
                          {entry.name.toUpperCase()} {entry.isMe && <span style={{ fontSize: 11, color: '#f9731660' }}>(YOU)</span>}
                        </span>
                        <span style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 20, color: i<3?medalColors[i]:'#666' }}>{entry.pct.toFixed(1)}%</span>
                      </div>
                      <ProgressBar pct={entry.pct} color={i===0?'#fbbf24':i===1?'#9ca3af':i===2?'#cd7c2d':'#f97316'} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 28, marginLeft: 42 }}>
                    <div><div style={{ fontSize: 9, letterSpacing: 2, color: '#444', fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 2 }}>TOTAL LBS</div><div style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 16, color: '#84cc16' }}>{entry.totalLbs.toLocaleString()}</div></div>
                    <div><div style={{ fontSize: 9, letterSpacing: 2, color: '#444', fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 2 }}>SESSIONS</div><div style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 16, color: '#ccc' }}>{entry.sessions}</div></div>
                    <div><div style={{ fontSize: 9, letterSpacing: 2, color: '#444', fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 2 }}>CARDIO MINS</div><div style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 16, color: '#38bdf8' }}>{entry.cardioMins}</div></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Switch challenge */}
            {joinedChallenges.length > 1 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 10, letterSpacing: 3, color: '#444', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, marginBottom: 10 }}>OTHER CHALLENGES</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {joinedChallenges.filter(c=>c.id!==activeChallengeId).map(c=>(
                    <button key={c.id} onClick={()=>setActiveChallengeId(c.id)} style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, color: '#888', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 1, padding: '8px 14px', cursor: 'pointer' }}>{c.name}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
