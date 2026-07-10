'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import type { CompanyRoleValue } from '@/types/database'

export function InviteTeammateForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<CompanyRoleValue>('admin')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const res = await fetch('/api/company-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    })
    if (!res.ok) {
      const body = await res.json()
      setError(body.error || 'Failed to invite')
      setSubmitting(false)
      return
    }
    setEmail('')
    setSubmitting(false)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="teammate@company.com"
        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as CompanyRoleValue)}
        className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
      >
        <option value="admin">Admin</option>
        <option value="viewer">Viewer</option>
      </select>
      <button type="submit" disabled={submitting}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Invite
      </button>
      {error && <p className="text-sm text-red-600 sm:ml-2 sm:self-center">{error}</p>}
    </form>
  )
}
