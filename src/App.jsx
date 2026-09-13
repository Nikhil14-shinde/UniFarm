import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth'
import FarmerDashboard from './FarmerDashboard'
import BuyerMarketplace from './BuyerMarketplace' // Added this import!

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (!error && data) {
      setProfile(data)
    }
    setLoading(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading UniFarm...</div>

  if (!session || !profile) {
    return <Auth />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-green-600 p-4 text-white flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">UniFarm</h1>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline">{profile.full_name} ({profile.role})</span>
          <button onClick={() => supabase.auth.signOut()} className="bg-green-700 hover:bg-green-800 px-4 py-2 rounded transition-colors">Sign Out</button>
        </div>
      </nav>
      <main className="p-4 sm:p-8 max-w-7xl mx-auto">
        {/* This now correctly loads the buyer marketplace */}
        {profile.role === 'farmer' ? (
          <FarmerDashboard user={session.user} />
        ) : (
          <BuyerMarketplace user={session.user} />
        )}
      </main>
    </div>
  )
}