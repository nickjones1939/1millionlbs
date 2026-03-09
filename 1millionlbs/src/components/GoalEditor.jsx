import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const PRESETS = [
  { label: '250K', value: 250_000 },
  { label: '500K', value: 500_000 },
  { label: '750K', value: 750_000 },
  { label: '1M',   value: 1_000_000 },
  { label: '1.5M', value: 1_500_000 },
  { label: '2M',   value: 2_000_000 },
]

export function useGoal(user) {
  const [goal, setGoal] = useState(1_000_000)
  const [loadingGoal, setLoadingGoal] = useState(true)

  useEffect(() => {
    if (!user) { setLoadingGoal(false); return }
    fetchGoal()
  }, [user])

  async function fetchGoal() {
    const { data } = await supabase
      .from('user_goals')
      .select('monthly_goal')
      .eq('user_id', user.id)
      .single()
    if (data?.monthly_goal) setGoal(data.monthly_goal)
    setLoadingGoal(false)
  }

  async function saveGoal(newGoal) {
    setGoal(newGoal)
    if (!user) return
    await supabase.from('user_goals').upsert({
      user_id: user.id,
      monthly_goal: newGoal,
      updated_at: new Date().toISOString(),
    })
  }

  return { goal, loadingGoal, saveGoal }
}

const css = `
  .goal-preset { padding: 12px 10px; border-radius: 8px; font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 15px; letter-spacing: 1px; cursor: pointer; transition: all 0.18s; text-align: center; border: 1px solid #222; background: #161616; color: #666; }
  .goal-preset:hover { border-color: #444; color: #ccc; }
  .goal-preset.selected { background: #84cc16; color: #000; border-color: #84cc16; box-shadow: 0 0 14px #84cc1640; }
  .goal-save-btn { width: 100%; padding: 14px; background: #84cc16; color: #000; border: none; border-radius: 9px; font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 15px; letter-spacing: 3px; cursor: pointer; transition: all 0.2s; }
  .goal-save-btn:hover { background: #a3e635; }
  .goal-custom-input { width: 100%; background: #161616; border: 1px solid #2a2a2a; border-radius: 8px; color: #fff; padding: 13px 15px; font-size: 28px; font-family: 'Oswald', sans-serif; font-weight: 700; outline: none; transition: border-color 0.2s; text-align: center; }
  .goal-custom-input:focus { border-color: #84cc16; }
  .goal-custom-input::placeholder { color: #333; }
`

export default function GoalEditor({ user, currentGoal, onSave, onClose }) {
  const [selected, setSelected] = useState(currentGoal)
  const [customVal, setCustomVal] = useState('')
  const [useCustom, setUseCustom] = useState(!PRESETS.find(p => p.value === currentGoal))
  const [saved, setSaved] = useState(false)

  const effectiveGoal = useCustom
    ? (parseInt(customVal.replace(/,/g, '')) || 0)
    : selected

  const handleSave = async () => {
    if (!effectiveGoal || effectiveGoal < 1000) return
    await onSave(effectiveGoal)
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 1200)
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        onClick={e => e.target === e.currentTarget && onClose()}>
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 16, padding: '36px 32px', width: '100%', maxWidth: 420 }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 26, color: '#fff', letterSpacing: 2, marginBottom: 4 }}>SET MONTHLY GOAL</div>
          <div style={{ fontSize: 13, color: '#555', marginBottom: 24 }}>Resets at the start of each month.</div>

          {/* Presets */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
            {PRESETS.map(p => (
              <button key={p.value}
                className={`goal-preset${!useCustom && selected === p.value ? ' selected' : ''}`}
                onClick={() => { setSelected(p.value); setUseCustom(false) }}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom */}
          <div style={{ marginBottom: 20 }}>
            <button onClick={() => setUseCustom(true)}
              style={{ background: 'none', border: 'none', color: useCustom ? '#84cc16' : '#555', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 2, cursor: 'pointer', marginBottom: 8, padding: 0 }}>
              {useCustom ? '✓ CUSTOM AMOUNT' : '+ SET CUSTOM AMOUNT'}
            </button>
            {useCustom && (
              <input className="goal-custom-input"
                placeholder="e.g. 1200000"
                value={customVal}
                onChange={e => setCustomVal(e.target.value)}
              />
            )}
          </div>

          {/* Preview */}
          {effectiveGoal > 0 && (
            <div style={{ background: '#84cc1608', border: '1px solid #84cc1625', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#84cc1680', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 2 }}>NEW GOAL</span>
              <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 24, color: '#84cc16' }}>{effectiveGoal.toLocaleString()} LBS</span>
            </div>
          )}

          <button className="goal-save-btn" onClick={handleSave} disabled={!effectiveGoal || effectiveGoal < 1000}>
            {saved ? '✓ SAVED' : 'SAVE GOAL'}
          </button>
        </div>
      </div>
    </>
  )
}
