import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TARGET = 1_000_000

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

const css = `
  .challenge-input { width: 100%; background: #161616; border: 1px solid #2a2a2a; border-radius: 8px; color: #fff; padding: 13px 15px; font-size: 15px; font-family: 'Barlow Condensed', sans-serif; font-weight: 700; letter-spacing: 2px; outline: none; transition: border-color 0.2s; }
  .challenge-input:focus { border-color: #f97316; }
  .challenge-input::placeholder { color: #333; }
  .ch-btn { padding: 13px 24px; border-radius: 9px; font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 14px; letter-spacing: 3px; cursor: pointer; transition: all 0.2s; border: none; }
  .ch-btn-primary { background: #f97316; color: #000; }
  .ch-btn-primary:hover { background: #fb923c; }
  .ch-btn-secondary { background: #161616; color: #f97316; border: 1.5px solid #f97316; }
  .ch-btn-secondary:hover { background: #f9731615; }
  .ch-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .copy-btn { background: #161616; border: 1px solid #2a2a2a; border-radius: 6px; color: #888; font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 11px; letter-spacing: 2px; padding: 6px 12px; cursor: pointer; transition: all 0.18s; }
  .copy-btn:hover { border-color: #f97316; color: #f97316; }
  .medal-1 { color: #fbbf24; }
  .medal-2 { color: #9ca3af; }
  .medal-3 { color: #b45309; }
`

function ProgressBar({ pct, color = '#f97316' }) {
  return (
    <div style={{ height: 6, background: '#1a1a1a', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 3, transition: 'width 0.5s ease', boxShadow: `0 0 6px ${color}60` }} />
    </div>
  )
}

export default function ChallengeView({ user, profile, userTotalLbs, userSessions, userCardioMins }) {
  const [tab, setTab]                   = useState('browse') // browse | create | join | view
  const [myChallenge, setMyChallenge]   = useState(null)
  const [joinedChallenges, setJoinedChallenges] = useState([])
  const [activeChallengeId, setActiveChallengeId] = useState(null)
  const [activeChallenge, setActiveChallenge] = useState(null)
  const [leaderboard, setLeaderboard]   = useState([])
  const [challengeName, setChallengeName] = useState('')
  const [joinCode, setJoinCode]         = useState('')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [copied, setCopied]             = useState('')
  const [loadingData, setLoadingData]   = useState(true)

  useEffect(() => { if (user) fetchMyChallenges() }, [user])
  useEffect(() => { if (activeChallengeId) fetchLeaderboard(activeChallengeId) }, [activeChallengeId])

  async function fetchMyChallenges() {
    setLoadingData(true)
    // Challenges I created
    const { data: created } = await supabase
      .from('challenges')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (created?.length) setMyChallenge(created[0])

    // Challenges I've joined
    const { data: memberships } = await supabase
      .from('challenge_members')
      .select('*, challenges(*)')
      .eq('user_id', user.id)

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
    // Get all members
    const { data: members } = await supabase
      .from('challenge_members')
      .select('user_id, profiles(display_name)')
      .eq('challenge_id', challengeId)

    if (!members?.length) return

    // Get workout totals for each member
    const leaderboardData = await Promise.all(members.map(async (m) => {
      const [{ data: workouts }, { data: cardio }] = await Promise.all([
        supabase.from('workouts').select('total_lbs, logged_at').eq('user_id', m.user_id),
        supabase.from('cardio_sessions').select('minutes, logged_at').eq('user_id', m.user_id),
      ])
      const totalLbs = (workouts || []).reduce((s, w) => s + w.total_lbs, 0)
      const sessions = (workouts || []).length
      const cardioMins = (cardio || []).reduce((s, c) => s + c.minutes, 0)
      return {
        userId: m.user_id,
        name: m.profiles?.display_name || 'Anonymous',
        totalLbs,
        sessions,
        cardioMins,
        pct: Math.min((totalLbs / TARGET) * 100, 100),
        isMe: m.user_id === user.id,
      }
    }))

    // Also include challenge creator if not already in members
    leaderboardData.sort((a, b) => b.totalLbs - a.totalLbs)
    setLeaderboard(leaderboardData)

    // Set active challenge info
    const { data: challenge } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single()
    if (challenge) setActiveChallenge(challenge)
  }

  async function handleCreate() {
    if (!challengeName.trim()) return
    setLoading(true); setError('')
    const code = generateCode()

    const { data: challenge, error: err } = await supabase
      .from('challenges')
      .insert({ name: challengeName.trim(), code, created_by: user.id, target_lbs: TARGET })
      .select().single()

    if (err) { setError(err.message); setLoading(false); return }

    // Auto-join as creator
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

    const { data: challenge } = await supabase
      .from('challenges')
      .select('*')
      .eq('code', joinCode.trim().toUpperCase())
      .single()

    if (!challenge) { setError('Challenge not found. Check the code and try again.'); setLoading(false); return }

    // Check if already a member
    const { data: existing } = await supabase
      .from('challenge_members')
      .select('id')
      .eq('challenge_id', challenge.id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      await supabase.from('challenge_members').insert({ challenge_id: challenge.id, user_id: user.id })
    }

    setActiveChallengeId(challenge.id)
    setLoading(false)
    setJoinCode('')
    setTab('view')
    fetchLeaderboard(challenge.id)
  }

  function copyToClipboard(text, key) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(''), 2000)
    })
  }

  const challengeUrl = activeChallenge ? `${window.location.origin}?challenge=${activeChallenge.code}` : ''
  const medals = ['🥇', '🥈', '🥉']
  const medalColors = ['#fbbf24', '#9ca3af', '#b45309']

  if (!user) return (
    <div style={{ maxWidth: 500 }}>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 40, color: '#fff', letterSpacing: 2, marginBottom: 6 }}>CHALLENGES</div>
      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 14, padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 8 }}>SIGN IN TO CHALLENGE FRIENDS</div>
        <div style={{ fontSize: 13, color: '#555' }}>Create or join a challenge to compete with your crew.</div>
      </div>
    </div>
  )

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="fade-up">
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 40, color: '#fff', letterSpacing: 2, lineHeight: 1, marginBottom: 6 }}>CHALLENGES</div>
        <div style={{ fontSize: 14, color: '#555', marginBottom: 28 }}>Race your crew to 1,000,000 lbs. First one there wins.</div>

        {/* Tab nav */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid #1e1e1e', paddingBottom: 0 }}>
          {(activeChallenge || myChallenge) && (
            <button onClick={() => setTab('view')}
              style={{ background: 'none', border: 'none', borderBottom: tab === 'view' ? '2px solid #f97316' : '2px solid transparent', color: tab === 'view' ? '#f97316' : '#555', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 2, padding: '8px 16px', cursor: 'pointer' }}>
              LEADERBOARD
            </button>
          )}
          <button onClick={() => setTab('create')}
            style={{ background: 'none', border: 'none', borderBottom: tab === 'create' ? '2px solid #f97316' : '2px solid transparent', color: tab === 'create' ? '#f97316' : '#555', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 2, padding: '8px 16px', cursor: 'pointer' }}>
            CREATE
          </button>
          <button onClick={() => setTab('join')}
            style={{ background: 'none', border: 'none', borderBottom: tab === 'join' ? '2px solid #f97316' : '2px solid transparent', color: tab === 'join' ? '#f97316' : '#555', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 2, padding: '8px 16px', cursor: 'pointer' }}>
            JOIN
          </button>
        </div>

        {/* CREATE tab */}
        {tab === 'create' && (
          <div style={{ maxWidth: 480 }}>
            <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 14, padding: '30px 32px' }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: '#f9731680', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, marginBottom: 18 }}>NEW CHALLENGE</div>
              <div style={{ fontSize: 10, letterSpacing: 2, color: '#444', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, marginBottom: 8 }}>CHALLENGE NAME</div>
              <input className="challenge-input" placeholder="e.g. THE BOYS · WINTER 2026"
                value={challengeName} onChange={e => setChallengeName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                style={{ marginBottom: 20 }} />
              <div style={{ background: '#0d0d0d', border: '1px solid #f9731620', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: '#f97316', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, marginBottom: 6 }}>🏆 HOW IT WORKS</div>
                <div style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>
                  First person to lift 1,000,000 lbs total wins. Share the code with your crew and track everyone's progress in real time.
                </div>
              </div>
              {error && <div style={{ background: '#f43f5e15', border: '1px solid #f43f5e40', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f43f5e', marginBottom: 14 }}>{error}</div>}
              <button className="ch-btn ch-btn-primary" onClick={handleCreate} disabled={loading || !challengeName.trim()}
                style={{ width: '100%' }}>
                {loading ? 'CREATING...' : 'CREATE CHALLENGE'}
              </button>
            </div>
          </div>
        )}

        {/* JOIN tab */}
        {tab === 'join' && (
          <div style={{ maxWidth: 480 }}>
            <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 14, padding: '30px 32px' }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: '#f9731680', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, marginBottom: 18 }}>JOIN A CHALLENGE</div>
              <div style={{ fontSize: 10, letterSpacing: 2, color: '#444', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, marginBottom: 8 }}>ENTER CODE</div>
              <input className="challenge-input" placeholder="e.g. ABC123"
                value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                style={{ marginBottom: 20, fontSize: 28, textAlign: 'center', letterSpacing: 8 }} />
              {error && <div style={{ background: '#f43f5e15', border: '1px solid #f43f5e40', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f43f5e', marginBottom: 14 }}>{error}</div>}
              <button className="ch-btn ch-btn-primary" onClick={handleJoin} disabled={loading || !joinCode.trim()}
                style={{ width: '100%' }}>
                {loading ? 'JOINING...' : 'JOIN CHALLENGE'}
              </button>
            </div>
          </div>
        )}

        {/* LEADERBOARD tab */}
        {tab === 'view' && activeChallenge && (
          <div style={{ maxWidth: 680 }}>
            {/* Challenge header */}
            <div style={{ background: '#111', border: '1px solid #f9731625', borderRadius: 14, padding: '24px 28px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: 3, color: '#f9731680', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, marginBottom: 6 }}>ACTIVE CHALLENGE</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 26, color: '#fff', letterSpacing: 1 }}>{activeChallenge.name}</div>
                  <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>First to 1,000,000 lbs wins 🏆</div>
                </div>
                {/* Share codes */}
                <div style={{ display: 'flex', flex: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 14px' }}>
                    <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 22, color: '#f97316', letterSpacing: 4 }}>{activeChallenge.code}</span>
                    <button className="copy-btn" onClick={() => copyToClipboard(activeChallenge.code, 'code')}>
                      {copied === 'code' ? '✓ COPIED' : 'COPY CODE'}
                    </button>
                  </div>
                  <button className="copy-btn" onClick={() => copyToClipboard(challengeUrl, 'url')}
                    style={{ width: '100%', padding: '8px 14px', marginTop: 6 }}>
                    {copied === 'url' ? '✓ LINK COPIED' : '🔗 COPY INVITE LINK'}
                  </button>
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', background: '#141414', borderBottom: '1px solid #1e1e1e' }}>
                <span style={{ fontSize: 10, letterSpacing: 3, color: '#444', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>LEADERBOARD — {leaderboard.length} COMPETITORS</span>
              </div>

              {leaderboard.length === 0 && (
                <div style={{ padding: '32px', textAlign: 'center', color: '#444', fontSize: 13 }}>
                  Waiting for members to join...
                </div>
              )}

              {leaderboard.map((entry, i) => (
                <div key={entry.userId} style={{ padding: '20px 24px', borderBottom: '1px solid #161616', background: entry.isMe ? '#f9731608' : 'transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                    <span style={{ fontSize: 22, width: 28, textAlign: 'center' }}>{i < 3 ? medals[i] : `#${i + 1}`}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16, color: entry.isMe ? '#f97316' : '#ccc', letterSpacing: 1 }}>
                          {entry.name.toUpperCase()} {entry.isMe && <span style={{ fontSize: 11, color: '#f9731680' }}>(YOU)</span>}
                        </span>
                        <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 20, color: i < 3 ? medalColors[i] : '#666' }}>
                          {entry.pct.toFixed(1)}%
                        </span>
                      </div>
                      <ProgressBar pct={entry.pct} color={i === 0 ? '#fbbf24' : i === 1 ? '#9ca3af' : i === 2 ? '#cd7c2d' : '#f97316'} />
                    </div>
                  </div>
                  {/* Stats row */}
                  <div style={{ display: 'flex', gap: 28, marginLeft: 42 }}>
                    <div>
                      <div style={{ fontSize: 9, letterSpacing: 2, color: '#444', fontFamily: "'Barlow Condensed', sans-serif", marginBottom: 2 }}>TOTAL LBS</div>
                      <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 16, color: '#84cc16' }}>{entry.totalLbs.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, letterSpacing: 2, color: '#444', fontFamily: "'Barlow Condensed', sans-serif", marginBottom: 2 }}>SESSIONS</div>
                      <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 16, color: '#ccc' }}>{entry.sessions}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, letterSpacing: 2, color: '#444', fontFamily: "'Barlow Condensed', sans-serif", marginBottom: 2 }}>CARDIO MINS</div>
                      <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 16, color: '#38bdf8' }}>{entry.cardioMins}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Switch challenge if multiple */}
            {joinedChallenges.length > 1 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 10, letterSpacing: 3, color: '#444', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, marginBottom: 10 }}>OTHER CHALLENGES</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {joinedChallenges.filter(c => c.id !== activeChallengeId).map(c => (
                    <button key={c.id} onClick={() => setActiveChallengeId(c.id)}
                      style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, color: '#888', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 1, padding: '8px 14px', cursor: 'pointer' }}>
                      {c.name}
                    </button>
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
