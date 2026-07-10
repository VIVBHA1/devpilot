import { CheckCircle2, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

const STEPS = [
  { label: 'Identity verification', time: 'up to 24 hours', desc: 'We verify your government ID via our KYC partner' },
  { label: 'Profile review', time: '2–3 days', desc: 'We check your LinkedIn, GitHub, and experience' },
  { label: 'Code assessment', time: '48 hours', desc: 'A short take-home test relevant to your stack' },
  { label: 'Architecture call', time: '30 min', desc: 'A video call with our technical team' },
  { label: 'Reference check', time: '', desc: 'We speak with one past client or employer' },
  { label: 'Profile goes live', time: '', desc: 'You join the DevPilot verified network' },
]

export default function ApplySuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Application received!</h1>
        <p className="text-gray-600 text-lg">We will review your profile within 5 business days.</p>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 text-left">
          <ShieldCheck className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900">
            <strong>Identity verification is in progress.</strong> Your government ID is being checked automatically —
            this usually takes a few minutes but can take up to 24 hours. We&apos;ll email you if we need a clearer photo.
          </p>
        </div>

        <div className="mt-10 bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-left">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-6">What happens next</h2>
          <ol className="space-y-5">
            {STEPS.map((s, i) => (
              <li key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  {i < STEPS.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1 mb-0" style={{ minHeight: 20 }} />}
                </div>
                <div className="pb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-gray-900">{s.label}</span>
                    {s.time && <span className="text-xs text-gray-400">({s.time})</span>}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          Have questions? Email us at{' '}
          <a href="mailto:hello@devpilot.in" className="text-[#2563EB] hover:underline">
            hello@devpilot.in
          </a>
        </p>

        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
          While you wait, join our Bengaluru developer community on{' '}
          <span className="font-medium">WhatsApp</span>{' '}
          <span className="text-gray-500">[link coming soon]</span>
        </div>

        <Link
          href="/"
          className="mt-8 inline-block text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Back to homepage
        </Link>
      </div>
    </div>
  )
}
