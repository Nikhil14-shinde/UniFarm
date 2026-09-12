import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('buyer')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAuth(e) {
    e.preventDefault()
    setLoading(true)
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.user) {
          await supabase.from('profiles').insert([
            { id: data.user.id, role, full_name: fullName }
          ])
        }
        alert('Signup successful! You can now log in.')
        setIsLogin(true)
      }
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <form onSubmit={handleAuth} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-center text-green-600 mb-2">UniFarm</h2>
        
        {!isLogin && (
          <>
            <input type="text" placeholder="Full Name" required value={fullName} onChange={e => setFullName(e.target.value)} className="border p-3 rounded" />
            <select value={role} onChange={e => setRole(e.target.value)} className="border p-3 rounded bg-white">
              <option value="buyer">I am a Buyer</option>
              <option value="farmer">I am a Farmer</option>
            </select>
          </>
        )}
        
        <input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} className="border p-3 rounded" />
        <input type="password" placeholder="Password (min 6 chars)" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="border p-3 rounded" />
        
        <button disabled={loading} className="bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700 transition-colors mt-2">
          {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
        </button>
        
        <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-sm text-blue-600 hover:underline text-center mt-2">
          {isLogin ? 'Need an account? Sign up' : 'Already have an account? Login'}
        </button>
      </form>
    </div>
  )
}