import Link from 'next/link'

const LINKS = [
  { href: '/admin', label: 'Applications' },
  { href: '/admin/briefs', label: 'Briefs' },
  { href: '/admin/engagements', label: 'Engagements' },
  { href: '/admin/analytics', label: 'Analytics' },
] as const

export function AdminNav({ active }: { active: (typeof LINKS)[number]['href'] }) {
  return (
    <nav className="bg-[#1E293B] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-blue-400">DevPilot Admin</span>
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                active === link.href
                  ? 'text-sm text-white font-medium border-b border-white pb-0.5'
                  : 'text-sm text-gray-400 hover:text-white'
              }
            >
              {link.label}
            </Link>
          ))}
        </div>
        <span className="text-xs text-gray-400">{process.env.ADMIN_EMAIL}</span>
      </div>
    </nav>
  )
}
