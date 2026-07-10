'use client'

import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, MailCheck } from 'lucide-react'

const schema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  company_email: z.string().email('A valid work email is required'),
  website: z.string().optional(),
  company_size: z.enum(['1-10', '11-50', '51-200', '200+']).optional(),
  industry: z.string().optional(),
  contact_name: z.string().min(1, 'Your name is required'),
  contact_role: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const inputCls = 'w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

export default function RegisterCompanyPage() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
  })

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/register-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Registration failed')
      }
      setDone(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <MailCheck className="w-10 h-10 text-[#2563EB] mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Check your inbox</h1>
          <p className="text-sm text-gray-600">We&apos;ve sent a verification link to your work email. Click it to activate your DevPilot company account.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create your company account</h1>
          <p className="mt-2 text-gray-600">Post roles, review ranked shortlists, and manage offers from one dashboard.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-4">
          <Field label="Company name *" error={errors.company_name?.message}>
            <input {...register('company_name')} className={inputCls} placeholder="Acme Inc." />
          </Field>
          <Field label="Work email *" error={errors.company_email?.message}>
            <input type="email" {...register('company_email')} className={inputCls} placeholder="rahul@acme.com" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Website"><input {...register('website')} className={inputCls} placeholder="https://acme.com" /></Field>
            <Field label="Company size">
              <select {...register('company_size')} className={inputCls}>
                <option value="">Select</option>
                {['1-10', '11-50', '51-200', '200+'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Industry"><input {...register('industry')} className={inputCls} placeholder="Fintech" /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Your name *" error={errors.contact_name?.message}>
              <input {...register('contact_name')} className={inputCls} placeholder="Rahul Gupta" />
            </Field>
            <Field label="Your role"><input {...register('contact_role')} className={inputCls} placeholder="Engineering Manager" /></Field>
          </div>
          {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <button type="submit" disabled={submitting}
            className="w-full flex justify-center items-center gap-2 py-3 bg-[#2563EB] text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-60">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
          <p className="text-xs text-center text-gray-400">
            Already registered? <a href="/login-company" className="text-[#2563EB] hover:underline">Sign in</a>
          </p>
        </form>
      </div>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
