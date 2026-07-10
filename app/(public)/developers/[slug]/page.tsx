import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatINR } from '@/lib/utils'
import { ExternalLink, Globe, Star, CheckCircle, ShieldCheck } from 'lucide-react'
import type { Metadata } from 'next'
import type { Developer, WorkHistory, PortfolioItem, Certification } from '@/types/database'

type DeveloperFull = Developer & {
  developer_work_history?: WorkHistory[]
  developer_portfolio_items?: PortfolioItem[]
  developer_certifications?: Certification[]
}

const TIER_COLORS = {
  Standard: 'bg-gray-100 text-gray-700',
  Senior: 'bg-blue-100 text-blue-700',
  Lead: 'bg-purple-100 text-purple-700',
}

const STACK_COLORS: Record<string, string> = {
  React: 'bg-blue-100 text-blue-700',
  'Next.js': 'bg-gray-900 text-white',
  'Vue.js': 'bg-green-100 text-green-700',
  Angular: 'bg-red-100 text-red-700',
  TypeScript: 'bg-blue-200 text-blue-800',
  'Node.js': 'bg-green-100 text-green-700',
  Python: 'bg-yellow-100 text-yellow-700',
  Java: 'bg-orange-100 text-orange-700',
  Go: 'bg-teal-100 text-teal-700',
  '.NET': 'bg-purple-100 text-purple-700',
  PostgreSQL: 'bg-blue-100 text-blue-700',
  MongoDB: 'bg-green-100 text-green-700',
  MySQL: 'bg-orange-100 text-orange-700',
  Redis: 'bg-red-100 text-red-700',
  AWS: 'bg-orange-100 text-orange-700',
  GCP: 'bg-blue-100 text-blue-700',
  Azure: 'bg-blue-200 text-blue-800',
  Docker: 'bg-blue-100 text-blue-700',
  Kubernetes: 'bg-blue-600 text-white',
  Terraform: 'bg-purple-100 text-purple-700',
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('developers')
    .select('full_name, primary_role, is_visible')
    .eq('slug', slug)
    .single()

  const dev = data as Pick<Developer, 'full_name' | 'primary_role' | 'is_visible'> | null
  if (!dev || !dev.is_visible) return { title: 'Not Found | DevPilot' }

  return {
    title: `${dev.full_name} — Verified ${dev.primary_role} Developer | DevPilot`,
  }
}

export default async function DeveloperProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: developerData } = await supabase
    .from('developers')
    .select('*, developer_work_history(*), developer_portfolio_items(*), developer_certifications(*), developer_rate_cards(*)')
    .eq('slug', slug)
    .eq('is_visible', true)
    .single()

  if (!developerData) notFound()
  const developer = developerData as DeveloperFull
  const workHistory = (developer.developer_work_history ?? []) as WorkHistory[]
  const portfolio = ((developer.developer_portfolio_items ?? []) as PortfolioItem[])
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
  const certifications = (developer.developer_certifications ?? []) as Certification[]
  const idVerified = developer.id_verification_status === 'verified'

  const roleLabel = developer.primary_role === 'Full-Stack'
    ? 'Full-Stack Developer'
    : developer.primary_role === 'Cloud'
    ? 'Cloud / DevOps Engineer'
    : 'Full-Stack & Cloud Engineer'

  const stars = developer.profile_score
    ? Math.round(developer.profile_score)
    : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: developer.full_name,
    jobTitle: roleLabel,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/developers/${developer.slug}`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-2xl bg-[#2563EB] flex items-center justify-center text-white text-xl font-bold shrink-0">
                {initials(developer.full_name)}
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900">{developer.full_name}</h1>
                <p className="text-gray-600 mt-0.5">{roleLabel}</p>

                <div className="flex flex-wrap gap-2 mt-3">
                  {developer.tier && (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${TIER_COLORS[developer.tier]}`}>
                      {developer.tier}
                    </span>
                  )}
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3" />
                    Verified by DevPilot
                  </span>
                  {idVerified && (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      <ShieldCheck className="w-3 h-3" />
                      Verified ID
                    </span>
                  )}
                  {developer.vetted_at && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs text-gray-500">
                      Verified {new Date(developer.vetted_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {developer.available_from && (
                <div>
                  <p className="text-xs text-gray-400">Available from</p>
                  <p className="font-medium text-gray-900">
                    {new Date(developer.available_from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400">Hours</p>
                <p className="font-medium text-gray-900">{developer.weekly_hours} hrs/week</p>
              </div>
              {developer.monthly_rate_min && developer.monthly_rate_max && (
                <div>
                  <p className="text-xs text-gray-400">Rate</p>
                  <p className="font-medium text-gray-900">
                    {formatINR(developer.monthly_rate_min)} – {formatINR(developer.monthly_rate_max)}/mo
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tech Stack */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Tech Stack</h2>
            <div className="flex flex-wrap gap-2">
              {developer.tech_stack.map((t: string) => (
                <span
                  key={t}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${STACK_COLORS[t] ?? 'bg-gray-100 text-gray-700'}`}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Video Intro */}
          {developer.video_intro_url && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Video Intro</h2>
              <video controls className="w-full rounded-xl bg-black max-h-96" src={developer.video_intro_url} />
            </div>
          )}

          {/* Work History */}
          {workHistory.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Work History</h2>
              <div className="space-y-4">
                {workHistory.map((w) => (
                  <div key={w.id} className="border-l-2 border-blue-100 pl-4">
                    <p className="font-medium text-gray-900">{w.role_title}</p>
                    <p className="text-sm text-gray-500">{w.company_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {w.start_date ? new Date(w.start_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''}
                      {w.start_date ? ' – ' : ''}
                      {w.end_date ? new Date(w.end_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Present'}
                    </p>
                    {w.description && <p className="text-sm text-gray-600 mt-1">{w.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio Gallery */}
          {portfolio.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Portfolio</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {portfolio.map((p) => (
                  <div key={p.id} className="border border-gray-100 rounded-xl overflow-hidden">
                    {p.image_url && <img src={p.image_url} alt={p.title} className="w-full h-40 object-cover" />}
                    <div className="p-4">
                      <p className="font-medium text-gray-900">{p.title}</p>
                      {p.description && <p className="text-sm text-gray-500 mt-1">{p.description}</p>}
                      {p.tech_stack && p.tech_stack.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {p.tech_stack.map((t) => (
                            <span key={t} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{t}</span>
                          ))}
                        </div>
                      )}
                      {p.project_url && (
                        <a href={p.project_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#2563EB] hover:underline mt-2 inline-block">
                          View project ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Certifications</h2>
              <div className="space-y-2">
                {certifications.map((c) => (
                  <div key={c.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{c.name}</span>
                      {c.verified && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                    </div>
                    <span className="text-xs text-gray-400">{c.issuing_body}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Experience & Links */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">About</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <p className="text-xs text-gray-400">Experience</p>
                <p className="font-medium text-gray-900">{developer.years_exp}+ years</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Based in</p>
                <p className="font-medium text-gray-900">{developer.city}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {developer.github_url && (
                <a href={developer.github_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
                  <ExternalLink className="w-4 h-4" /> GitHub
                </a>
              )}
              {developer.linkedin_url && (
                <a href={developer.linkedin_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
                  <ExternalLink className="w-4 h-4" /> LinkedIn
                </a>
              )}
              {developer.portfolio_url && (
                <a href={developer.portfolio_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
                  <Globe className="w-4 h-4" /> Portfolio
                </a>
              )}
            </div>
          </div>

          {/* Ratings (only if has engagements) */}
          {developer.total_engagements > 0 && developer.profile_score && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Ratings</h2>
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold text-gray-900">{developer.profile_score.toFixed(1)}</div>
                <div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < (stars ?? 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Based on {developer.total_engagements} engagement{developer.total_engagements !== 1 ? 's' : ''} on DevPilot</p>
                </div>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="bg-[#2563EB] rounded-2xl p-6 text-white text-center">
            <h2 className="text-lg font-semibold mb-1">Interested in working with {developer.full_name.split(' ')[0]}?</h2>
            <p className="text-blue-200 text-sm mb-4">Post your brief and we'll set up an intro within 24 hours.</p>
            <a
              href={`/post-brief?preferred_developer=${developer.slug}`}
              className="inline-block bg-white text-[#2563EB] font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-blue-50 transition-colors"
            >
              Request this developer
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
