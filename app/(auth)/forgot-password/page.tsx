'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/update-password`,
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔑</div>
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
        </div>

        {sent ? (
          <div className="card text-center space-y-3">
            <div className="text-green-400 text-3xl">✓</div>
            <p className="text-gray-300">Check your email for a reset link.</p>
            <Link href="/login" className="text-brand-400 hover:text-brand-300 text-sm">
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="card space-y-4">
            {error && (
              <div className="bg-red-900/30 border border-red-700 text-red-300 px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}
            <p className="text-gray-400 text-sm">
              Enter your email and we'll send you a password reset link.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="you@example.com"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
            <div className="text-center">
              <Link href="/login" className="text-sm text-gray-400 hover:text-gray-300">
                Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
