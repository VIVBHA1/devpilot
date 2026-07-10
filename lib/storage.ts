import { createAdminClient } from '@/lib/supabase/admin'

export const PUBLIC_BUCKET = process.env.NEXT_PUBLIC_STORAGE_PUBLIC_BUCKET || 'devpilot-public'
export const ID_DOCS_BUCKET = process.env.STORAGE_ID_DOCS_BUCKET || 'devpilot-id-docs'

// "id-docs" uploads land in the private bucket (§3 / §7 — never public).
// Everything else (portfolio, certs, video, brief attachments) is public.
export type UploadKind = 'id-doc' | 'portfolio' | 'certificate' | 'video' | 'brief-attachment' | 'skill-cert' | 'brief-jd-doc'

function bucketFor(kind: UploadKind): string {
  return kind === 'id-doc' ? ID_DOCS_BUCKET : PUBLIC_BUCKET
}

export async function uploadFile(
  kind: UploadKind,
  file: File
): Promise<{ path: string; url: string | null }> {
  const supabase = createAdminClient()
  const bucket = bucketFor(kind)
  const ext = file.name.split('.').pop() || 'bin'
  const path = `${kind}/${crypto.randomUUID()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, arrayBuffer, { contentType: file.type || 'application/octet-stream', upsert: false })

  if (error) throw error

  // Private bucket → no public URL; store path only, read via signed URL server-side.
  if (kind === 'id-doc') return { path, url: null }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return { path, url: data.publicUrl }
}

// Signed URL for reading a private ID document (admin only, service role).
export async function signedIdDocUrl(path: string, expiresInSeconds = 300): Promise<string | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.storage.from(ID_DOCS_BUCKET).createSignedUrl(path, expiresInSeconds)
  if (error) return null
  return data.signedUrl
}
