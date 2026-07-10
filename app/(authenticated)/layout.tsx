import { redirect } from 'next/navigation'
import { getCompanySession } from '@/lib/auth/companySession'

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const session = await getCompanySession()
  if (!session) redirect('/login-company')
  return <>{children}</>
}
