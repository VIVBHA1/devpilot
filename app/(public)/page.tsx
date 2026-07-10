import Link from 'next/link'
import { CheckCircle, Clock, Shield, Star } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-medium text-blue-700 mb-6">
          <CheckCircle className="w-3.5 h-3.5" />
          Every developer personally vetted by our technical team
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
          Hire pre-vetted developers<br />in 24 hours
        </h1>
        <p className="mt-5 text-xl text-gray-500 max-w-2xl mx-auto">
          DevPilot matches Bengaluru startups with rigorously screened Full-Stack and Cloud developers.
          No agencies, no guesswork.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/post-brief"
            className="px-8 py-3.5 bg-[#2563EB] text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
          >
            Post a brief — free
          </Link>
          <Link
            href="/apply"
            className="px-8 py-3.5 bg-white text-gray-700 rounded-xl font-semibold text-sm border border-gray-300 hover:border-gray-400 transition-colors"
          >
            Apply as a developer
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { num: '1', title: 'Post your brief', desc: 'Tell us what you need in 5 minutes. Role, tech stack, duration, budget.', icon: Clock },
              { num: '2', title: 'Get 3 matches', desc: 'We shortlist 3 verified profiles within 24 hours. Each one vetted by us.', icon: Shield },
              { num: '3', title: 'Start building', desc: 'Pick your developer, sign the agreement, and kick off within days.', icon: Star },
            ].map((step) => (
              <div key={step.num} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-sm font-bold mb-4">
                  {step.num}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">The DevPilot difference</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: '7-step vetting', desc: 'Profile review, code test, architecture call, reference check — only ~15% pass.' },
              { title: 'Fixed platform fee', desc: '13% fee baked in. No recruitment markups, no surprise costs.' },
              { title: 'Escrow payments', desc: 'You release payment only after approving each milestone.' },
              { title: 'Bengaluru-first', desc: 'Timezone aligned, in-person possible. We know the local talent market.' },
            ].map((item) => (
              <div key={item.title} className="p-5 bg-gray-50 rounded-2xl">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#2563EB] py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to hire?</h2>
          <p className="text-blue-200 mb-8">Post a brief for free. No commitment until you sign.</p>
          <Link
            href="/post-brief"
            className="inline-block px-8 py-3.5 bg-white text-[#2563EB] rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors"
          >
            Find me a developer →
          </Link>
        </div>
      </section>
    </div>
  )
}
