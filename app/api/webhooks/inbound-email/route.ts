import { NextRequest, NextResponse } from 'next/server'

// STUB — forwarded-role intake via roles+{buyer_id}@parse.devpilot.in. §Prompt 18.
//
// Not wired to a live inbound-email provider yet: which provider to use (Resend inbound,
// Postmark, SendGrid Inbound Parse, or a custom MX + Mailgun route) is an open question —
// each has a different webhook payload shape and signature scheme, so this route can't be
// implemented correctly without picking one. Once decided: verify the provider's webhook
// signature, extract the buyer_id from the recipient address, then reuse
// lib/parseDocument.ts's parseBriefDocument() on the email body/attachments and create a
// draft brief with source_type='forwarded_email', identical to the manual-upload path in
// app/api/briefs/parse/route.ts.
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: 'Inbound email intake is not configured yet — post the role via the form or file upload instead.' },
    { status: 501 }
  )
}
