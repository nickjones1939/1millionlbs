import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// Seed data for guest mode
function generateSeedLifts() {
  const now = Date.now()
  const entries = []
  const groups = ["chest","back","legs","arms","shoulders","core","glutes"]
  for (let i = 0; i < 42; i++) {
    const daysAgo = Math.floor(Math.random() * 28)
    const group = groups[Math.floor(Math.random() * groups.length)]
    const sets = Math.floor(Math.random() * 4) + 2
    const reps = [5,8,10,12,15][Math.floor(Math.random() * 5)]
    const weight = [45,65,95,115,135,155,185,225,275,315][Math.floor(Math.random() * 10)]
    entries.push({
      id: `seed-${i}`, type: "lift",
      timestamp: now - daysAgo * 86400000 - Math.random() * 86400000,
      muscleGroup: group, sets, reps, weight,
      total: sets * reps * weight,
    })
  }
  return entries
}

function generateSeedCardio() {
  const now = Date.now()
  const sessions = []
  const types = ["Running","Cycling","Rowing","HIIT","Stairmaster"]
  const diffs = ["light","medium","hardo"]
  for (let i = 0; i < 8; i++) {
    const daysAgo = Math.floor(Math.random() * 28)
    sessions.push({
      id: `cardio-seed-${i}`, type: "cardio",
      timestamp: now - daysAgo * 86400000 - Math.random() * 86400000,
      cardioType: types[Math.floor(Math.random() * types.length)],
      minutes: [20,30,35,45,60][Math.floor(Math.random() * 5)],
      difficulty: diffs[Math.floor(Math.random() * diffs.length)],
    })
  }
  return sessions
}

const SEED_LIFTS  = generateSeedLifts()
const SEED_CARDIO = generateSeedCardio()

export function useWorkouts(user) {
  const [entries,   setEntries]   = useState(user ? [] : SEED_LIFTS)
  const [cardioLog, setCardioLog] = useState(user ? [] : SEED_CARDIO)
  const [loadingData, setLoadingData] = useState(!!user)

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoadingData(true)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()

    const [{ data: lifts }, { data: cardio }] = await Promise.all([
      supabase.from('workouts').select('*').eq('user_id', user.id).gte('logged_at', thirtyDaysAgo).order('logged_at', { ascending: false }),
      supabase.from('cardio_sessions').select('*').eq('user_id', user.id).gte('logged_at', thirtyDaysAgo).order('logged_at', { ascending: false }),
    ])

    setEntries((lifts || []).map(r => ({
      id: r.id, type: 'lift',
      timestamp: new Date(r.logged_at).getTime(),
      muscleGroup: r.muscle_group,
      sets: r.sets, reps: r.reps, weight: r.weight,
      total: r.total_lbs,
    })))

    setCardioLog((cardio || []).map(r => ({
      id: r.id, type: 'cardio',
      timestamp: new Date(r.logged_at).getTime(),
      cardioType: r.cardio_type,
      minutes: r.minutes,
      difficulty: r.difficulty,
    })))

    setLoadingData(false)
  }, [user])

  useEffect(() => {
    if (user) fetchData()
    else {
      setEntries(SEED_LIFTS)
      setCardioLog(SEED_CARDIO)
    }
  }, [user, fetchData])

  async function logLift(form) {
    const total = parseInt(form.sets) * parseInt(form.reps) * parseFloat(form.weight)
    const newEntry = {
      id: Date.now().toString(), type: 'lift',
      timestamp: Date.now(),
      muscleGroup: form.muscleGroup,
      sets: parseInt(form.sets), reps: parseInt(form.reps),
      weight: parseFloat(form.weight), total,
    }

    if (user) {
      const { data, error } = await supabase.from('workouts').insert({
        user_id: user.id,
        muscle_group: form.muscleGroup,
        sets: parseInt(form.sets),
        reps: parseInt(form.reps),
        weight: parseFloat(form.weight),
        total_lbs: total,
        logged_at: new Date().toISOString(),
      }).select().single()
      if (!error && data) {
        newEntry.id = data.id
      }
    }

    setEntries(prev => [...prev, newEntry])
    return newEntry
  }

  async function logCardio(form) {
    const newSession = {
      id: Date.now().toString(), type: 'cardio',
      timestamp: Date.now(),
      cardioType: form.cardioType,
      minutes: parseInt(form.minutes),
      difficulty: form.difficulty,
    }

    if (user) {
      const { data, error } = await supabase.from('cardio_sessions').insert({
        user_id: user.id,
        cardio_type: form.cardioType,
        minutes: parseInt(form.minutes),
        difficulty: form.difficulty,
        logged_at: new Date().toISOString(),
      }).select().single()
      if (!error && data) {
        newSession.id = data.id
      }
    }

    setCardioLog(prev => [...prev, newSession])
    return newSession
  }

  return { entries, cardioLog, loadingData, logLift, logCardio }
}
