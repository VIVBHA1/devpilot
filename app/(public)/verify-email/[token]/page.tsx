import Link from 'next/link'
import { CheckCircle2, XCircle } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()

  const { data: buyer } = await supabase
    .from('buyers')
    .select('id, email_verification_expires_at, email_domain_verified, company_email')
    .eq('email_verification_token', token)
    .single()

  const expired = buyer && buyer.email_verification_expires_at && new Date(buyer.email_verification_expires_at) < new Date()

  if (buyer && !buyer.email_domain_verified && !expired) {
    await supabase
      .from('buyers')
      .update({ email_domain_verified: true, email_verification_token: null, email_verification_expires_at: null })
      .eq('id', buyer.id)
  }

  const success = !!buyer && (buyer.email_domain_verified || !expired)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        {success ? (
          <>
            <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Email verified</h1>
            <p className="text-sm text-gray-600 mb-6">Your company account is active. Sign in to reach your dashboard.</p>
            <Link href="/login-company" className="inline-block px-5 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              Sign in
            </Link>
          </>
        ) : (
          <>
            <XCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Link expired or invalid</h1>
            <p className="text-sm text-gray-600 mb-6">Register again to get a fresh verification link.</p>
            <Link href="/register-company" className="inline-block px-5 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              Register
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
