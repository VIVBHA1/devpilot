import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function BriefSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Brief received!</h1>
        <p className="text-gray-600 text-lg">We'll shortlist 3 verified developers for you within 24 hours.</p>

        <div className="mt-10 bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-left space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">What happens next</h2>
          {[
            { step: '1', title: 'Brief review', desc: 'We read your requirement and identify the right profile type.' },
            { step: '2', title: 'Developer matching', desc: 'We shortlist 3 vetted profiles that match your stack and budget.' },
            { step: '3', title: 'You receive the matches', desc: 'Email with 3 profile links arrives within 24 hours.' },
            { step: '4', title: 'Intro call', desc: 'We set up a 30-min intro with your chosen developer.' },
            { step: '5', title: 'Contract & kickoff', desc: 'Sign the engagement agreement and get started.' },
          ].map((s) => (
            <div key={s.step} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {s.step}
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">{s.title}</p>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm text-gray-500">
          Questions? Email us at{' '}
          <a href="mailto:hello@devpilot.in" className="text-[#2563EB] hover:underline">hello@devpilot.in</a>
        </p>

        <Link href="/" className="mt-6 inline-block text-sm text-gray-500 hover:text-gray-700 underline">
          Back to homepage
        </Link>
      </div>
    </div>
  )
}
