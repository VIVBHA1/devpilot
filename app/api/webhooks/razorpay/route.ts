import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-razorpay-signature') ?? ''
  const secret = process.env.RAZORPAY_KEY_SECRET ?? ''

  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')

  if (expected !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(body)

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity
    const milestoneId = payment.notes?.milestone_id

    if (milestoneId) {
      const supabase = createAdminClient()
      await supabase
        .from('milestones')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          razorpay_payment_id: payment.id,
        })
        .eq('id', milestoneId)
    }
  }

  return NextResponse.json({ received: true })
}
