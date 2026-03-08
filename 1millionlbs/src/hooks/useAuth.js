import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  async function signInWithApple() {
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: window.location.origin }
    })
  }

  async function signInWithSpotify() {
    await supabase.auth.signInWithOAuth({
      provider: 'spotify',
      options: { redirectTo: window.location.origin }
    })
  }

  async function signInWithEmail(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signUpWithEmail(email, password) {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin }
    })
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function saveProfile(userId, displayName) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, display_name: displayName, updated_at: new Date().toISOString() })
      .select()
      .single()
    if (!error) setProfile(data)
    return { error }
  }

  return {
    user, profile, loading,
    signInWithGoogle, signInWithApple, signInWithSpotify,
    signInWithEmail, signUpWithEmail,
    signOut, saveProfile,
  }
}
