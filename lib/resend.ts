import { Resend } from 'resend'

// Lazy init so build doesn't fail without env vars
function getResend() {
  return new Resend(process.env.RESEND_API_KEY || 'placeholder')
}
const FROM = () => process.env.EMAIL_FROM || 'noreply@devpilot.in'
const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL || 'https://devpilot.in'

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Inter,system-ui,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 16px">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
          <tr>
            <td style="background:#2563EB;border-radius:12px 12px 0 0;padding:24px 32px">
              <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.5px">DevPilot</span>
            </td>
          </tr>
          <tr>
            <td style="background:#fff;border-radius:0 0 12px 12px;padding:32px;border:1px solid #e5e7eb;border-top:none">
              ${content}
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0">
              <p style="color:#9ca3af;font-size:13px;margin:0">The DevPilot Team, Bengaluru</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendApplicationReceived(developer: {
  full_name: string
  email: string
  primary_role: string
}) {
  const content = `
    <h2 style="color:#111827;margin:0 0 16px">Hi ${developer.full_name},</h2>
    <p style="color:#374151;line-height:1.6;margin:0 0 16px">
      We've received your application to join DevPilot as a <strong>${developer.primary_role} Developer</strong>.
      Our team will review your profile within <strong>5 business days</strong>.
    </p>
    <p style="color:#374151;line-height:1.6;margin:0 0 24px">
      The full vetting process takes <strong>7–10 business days</strong> and includes a profile review,
      code assessment, architecture call, and reference check.
    </p>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin-bottom:24px">
      <p style="color:#1e40af;font-size:14px;margin:0;font-weight:500">What's next?</p>
      <p style="color:#1d4ed8;font-size:14px;margin:8px 0 0">
        Watch your inbox — we'll email you when we're ready to move forward.
      </p>
    </div>
    <p style="color:#374151;line-height:1.6;margin:0">
      Questions? Reply to this email or reach us at
      <a href="mailto:hello@devpilot.in" style="color:#2563EB">hello@devpilot.in</a>.
    </p>
  `
  return getResend().emails.send({
    from: FROM(),
    to: developer.email,
    subject: 'Your DevPilot application is being reviewed',
    html: baseTemplate(content),
  })
}

export async function sendApplicationApproved(developer: {
  full_name: string
  email: string
  slug: string
}) {
  const profileUrl = `${APP_URL()}/developers/${developer.slug}`
  const content = `
    <h2 style="color:#111827;margin:0 0 16px">Congratulations, ${developer.full_name}!</h2>
    <p style="color:#374151;line-height:1.6;margin:0 0 16px">
      You're now a <strong>Verified DevPilot Developer</strong>. Your profile is live and visible to our network of vetted buyers.
    </p>
    <div style="text-align:center;margin:24px 0">
      <a href="${profileUrl}" style="background:#2563EB;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
        View Your Profile
      </a>
    </div>
    <p style="color:#374151;line-height:1.6;margin:0 0 16px">
      Your public profile: <a href="${profileUrl}" style="color:#2563EB">${profileUrl}</a>
    </p>
    <p style="color:#374151;line-height:1.6;margin:0 0 16px">
      You'll receive project matches via <strong>email and WhatsApp</strong>. Typical turnaround from match to engagement is 3–5 days.
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:16px">
      <p style="color:#166534;font-size:14px;margin:0;font-weight:500">Refer a colleague</p>
      <p style="color:#15803d;font-size:14px;margin:8px 0 0">
        Refer another developer who gets approved and earn a lifetime reduced platform fee. Reply to this email to get your referral link.
      </p>
    </div>
  `
  return getResend().emails.send({
    from: FROM(),
    to: developer.email,
    subject: 'You are now a Verified DevPilot Developer',
    html: baseTemplate(content),
  })
}

export async function sendApplicationRejected(developer: {
  full_name: string
  email: string
  primary_role: string
}) {
  const content = `
    <h2 style="color:#111827;margin:0 0 16px">Hi ${developer.full_name},</h2>
    <p style="color:#374151;line-height:1.6;margin:0 0 16px">
      Thank you for applying to DevPilot. After carefully reviewing your profile, we're not moving forward with your application at this time.
    </p>
    <p style="color:#374151;line-height:1.6;margin:0 0 16px">
      Our acceptance bar is high because we make quality guarantees to our buyers. This decision doesn't reflect on your abilities — it reflects the specific match criteria we use at this stage.
    </p>
    <p style="color:#374151;line-height:1.6;margin:0 0 16px">
      We welcome you to <strong>reapply in 3 months</strong>. In the meantime, continuing to build depth in your primary stack and gathering concrete project outcomes will strengthen your next application.
    </p>
    <p style="color:#374151;line-height:1.6;margin:0">
      We appreciate the time you spent applying and wish you the best.
    </p>
  `
  return getResend().emails.send({
    from: FROM(),
    to: developer.email,
    subject: 'DevPilot application update',
    html: baseTemplate(content),
  })
}

export async function sendShortlistReady(
  buyer: { contact_name: string; company_email: string; company_name: string },
  brief: { title: string; id: string },
  developers: Array<{ full_name: string; primary_role: string; slug: string }>
) {
  const appUrl = APP_URL()
  const devCards = developers
    .map(
      (d, i) => `
      <tr>
        <td style="padding:12px;background:#f9fafb;border-radius:8px;margin-bottom:8px;border:1px solid #e5e7eb">
          <p style="margin:0;font-weight:600;color:#111827">${i + 1}. ${d.full_name}</p>
          <p style="margin:4px 0 8px;font-size:13px;color:#6b7280">${d.primary_role} Developer</p>
          <a href="${appUrl}/developers/${d.slug}" style="background:#2563EB;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:500">
            View Profile - Verified
          </a>
        </td>
      </tr>
      <tr><td style="height:8px"></td></tr>
    `
    )
    .join('')

  const content = `
    <h2 style="color:#111827;margin:0 0 16px">Hi ${buyer.contact_name},</h2>
    <p style="color:#374151;line-height:1.6;margin:0 0 16px">
      Your 3 DevPilot developer matches for <strong>"${brief.title}"</strong> are ready. Each profile has been personally vetted by our technical team.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
      ${devCards}
    </table>
    <div style="text-align:center;margin:24px 0">
      <a href="${appUrl}/dashboard" style="background:#2563EB;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
        Select Your Developer
      </a>
    </div>
    <p style="color:#6b7280;font-size:13px;margin:0">
      You have <strong>48 hours</strong> to review and select. Reply to this email if you need more time or have questions.
    </p>
  `
  return getResend().emails.send({
    from: FROM(),
    to: buyer.company_email,
    subject: 'Your 3 DevPilot developer matches are ready',
    html: baseTemplate(content),
  })
}

export async function sendKycRejected(developer: {
  full_name: string
  email: string
  developer_id: string
}) {
  const reuploadUrl = `${APP_URL()}/apply/kyc/${developer.developer_id}`
  const content = `
    <h2 style="color:#111827;margin:0 0 16px">Hi ${developer.full_name},</h2>
    <p style="color:#374151;line-height:1.6;margin:0 0 16px">
      We weren't able to verify the identity document you submitted. This can happen when an image is blurry,
      cropped, or doesn't match the details on your application.
    </p>
    <div style="text-align:center;margin:24px 0">
      <a href="${reuploadUrl}" style="background:#2563EB;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
        Re-upload your ID
      </a>
    </div>
    <p style="color:#374151;line-height:1.6;margin:0">
      Please upload a clear, full photo of a government ID (Aadhaar, PAN, Passport, or Driving Licence).
      Your application stays active — only the ID step needs to be redone.
    </p>
  `
  return getResend().emails.send({
    from: FROM(),
    to: developer.email,
    subject: 'Action needed: verify your DevPilot identity',
    html: baseTemplate(content),
  })
}

export async function sendRatingNotification(developer: {
  full_name: string
  email: string
  rating: number
  company_name: string
}) {
  const stars = '★'.repeat(Math.round(developer.rating)) + '☆'.repeat(5 - Math.round(developer.rating))
  const content = `
    <h2 style="color:#111827;margin:0 0 16px">Hi ${developer.full_name},</h2>
    <p style="color:#374151;line-height:1.6;margin:0 0 16px">
      <strong>${developer.company_name}</strong> has rated your engagement on DevPilot.
    </p>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px">
      <p style="font-size:28px;margin:0;color:#f59e0b">${stars}</p>
      <p style="font-size:24px;font-weight:700;color:#111827;margin:8px 0 0">${developer.rating.toFixed(1)} / 5.0</p>
      <p style="font-size:13px;color:#6b7280;margin:4px 0 0">Overall rating</p>
    </div>
    <p style="color:#374151;line-height:1.6;margin:0">
      This rating is now reflected on your DevPilot profile and helps you get matched with more projects.
    </p>
  `
  return getResend().emails.send({
    from: FROM(),
    to: developer.email,
    subject: `You received a ${developer.rating.toFixed(1)} star rating from ${developer.company_name}`,
    html: baseTemplate(content),
  })
}
