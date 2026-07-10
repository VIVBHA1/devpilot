'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, MailCheck } from 'lucide-react'

export default function LoginCompanyPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard` },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-2xl font-bold text-[#2563EB]">DevPilot</span>
          <p className="text-sm text-gray-500 mt-1">Company dashboard sign-in</p>
        </div>

        {sent ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <MailCheck className="w-10 h-10 text-[#2563EB] mx-auto mb-4" />
            <p className="text-sm text-gray-600">Check <strong>{email}</strong> for a sign-in link.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="rahul@acme.com"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Send sign-in link
            </button>
            <p className="text-xs text-center text-gray-400">
              No account yet? <a href="/register-company" className="text-[#2563EB] hover:underline">Register your company</a>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
