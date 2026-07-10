'use client'

import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Layers, Cloud, HelpCircle, Loader2, ShieldCheck, Clock, CheckCircle, X, FileText, Sparkles, AlertTriangle } from 'lucide-react'
import { FileUpload } from '@/components/ui/FileUpload'
import { SkillTaxonomyPicker, type SkillTagValue } from '@/components/ui/SkillTaxonomyPicker'
import type { ParsedBriefFields, BriefPriorityValue, BriefSourceTypeValue } from '@/types/database'

const DURATION_OPTIONS = [
  { label: '2 weeks', value: 2 }, { label: '1 month', value: 4 }, { label: '2 months', value: 8 },
  { label: '3 months', value: 13 }, { label: '6 months', value: 26 }, { label: 'Ongoing', value: 52 },
]
const REFERRAL_OPTIONS = ['VC recommendation', 'Google', 'LinkedIn', 'Referral', 'Other']
const EXPERIENCE_LEVELS = ['Junior', 'Mid', 'Senior', 'Any'] as const

const schema = z.object({
  // Section 1
  role_type: z.enum(['Full-Stack', 'Cloud', 'DevOps', 'Both']),
  title: z.string().min(3, 'Project title is required'),
  description: z.string().min(50, 'Please describe your requirement (min 50 characters)'),
  project_type: z.enum(['fixed', 'hourly']),
  experience_level_required: z.enum(EXPERIENCE_LEVELS),
  // Section 2
  tech_stack: z.array(z.string()).optional(),
  duration_weeks: z.coerce.number().min(1),
  weekly_hours: z.coerce.number().refine((v) => v === 20 || v === 40),
  start_date: z.string().optional(),
  // Section 3
  budget_min: z.coerce.number().optional(),
  budget_max: z.coerce.number().optional(),
  is_negotiable: z.boolean(),
  priority: z.enum(['urgent', 'high', 'standard']),
  // Section 5
  company_name: z.string().min(1, 'Company name is required'),
  contact_name: z.string().min(1, 'Your name is required'),
  email: z.string().email('Valid email required'),
  referral: z.string().optional(),
})
type FormData = z.infer<typeof schema>

type Attachment = { file_url: string; file_name: string; file_type: string; parsed_fields?: ParsedBriefFields }

const ROLE_OPTIONS = [
  { value: 'Full-Stack', label: 'Full-Stack Developer', icon: Layers },
  { value: 'Cloud', label: 'Cloud / DevOps Engineer', icon: Cloud },
  { value: 'Both', label: 'Both / Not Sure', icon: HelpCircle },
] as const

const inputCls = 'w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

export default function PostBriefPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [figmaLink, setFigmaLink] = useState('')
  const [skillTags, setSkillTags] = useState<SkillTagValue[]>([])
  const [sourceType, setSourceType] = useState<BriefSourceTypeValue>('manual_form')
  const [parsing, setParsing] = useState(false)
  const [parsedFields, setParsedFields] = useState<ParsedBriefFields | null>(null)

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { tech_stack: [], is_negotiable: true, priority: 'standard' },
  })

  const description = watch('description') ?? ''

  const handleSkillTagsChange = (tags: SkillTagValue[]) => {
    setSkillTags(tags)
    setValue('tech_stack', tags.map((t) => t.name))
  }

  const handleJdUpload = async ({ url, fileName }: { url: string | null; fileName: string; fileType: string }) => {
    if (!url) return
    setAttachments((a) => [...a, { file_url: url, file_name: fileName, file_type: 'pdf' }])
    setSourceType('pdf_upload')
    setParsing(true)
    try {
      const res = await fetch('/api/briefs/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_url: url, file_type: 'pdf' }),
      })
      const { parsed } = await res.json()
      setParsedFields(parsed)
      setAttachments((a) => a.map((att) => (att.file_url === url ? { ...att, parsed_fields: parsed } : att)))
      if (parsed.role_type) setValue('role_type', parsed.role_type as FormData['role_type'])
      if (parsed.duration_weeks) setValue('duration_weeks', parsed.duration_weeks)
      if (parsed.budget_min) setValue('budget_min', parsed.budget_min)
      if (parsed.budget_max) setValue('budget_max', parsed.budget_max)
      if (parsed.experience_level_required) setValue('experience_level_required', parsed.experience_level_required as FormData['experience_level_required'])
    } catch {
      setParsedFields({ confidence: 'low' })
    } finally {
      setParsing(false)
    }
  }

  const addFigmaLink = () => {
    if (!figmaLink.trim()) return
    setAttachments((a) => [...a, { file_url: figmaLink.trim(), file_name: 'Figma link', file_type: 'figma_link' }])
    setFigmaLink('')
  }

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/briefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, attachments, skill_tags: skillTags, source_type: sourceType }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Submission failed')
      }
      router.push('/post-brief/success')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Find a verified developer</h1>
          <p className="mt-2 text-gray-600">Tell us what you need. We&apos;ll shortlist 3 profiles within 24 hours.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* SECTION 0 — Auto-fill from a JD */}
          <Section title="Optional: auto-fill from a job description">
            <p className="text-xs text-gray-500 mb-3">Upload a PDF and we&apos;ll pre-fill the fields below. Every AI-parsed field stays editable — review before publishing.</p>
            <FileUpload kind="brief-jd-doc" accept="application/pdf" label={parsing ? 'Parsing…' : 'Upload JD (PDF)'} onUploaded={handleJdUpload} />
            {parsing && (
              <p className="mt-2 text-xs text-gray-500 flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Reading your document…</p>
            )}
            {parsedFields && !parsing && (
              <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                <p className="text-xs font-medium text-blue-800 flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5" /> AI-parsed — review before publishing
                </p>
                {parsedFields.tech_stack?.length ? (
                  <p className="text-xs text-blue-700 mb-1">Suggested skills: {parsedFields.tech_stack.join(', ')} — add matching ones below.</p>
                ) : null}
                {parsedFields.low_confidence_fields?.length ? (
                  <p className="text-xs text-amber-700 flex items-center gap-1.5 mt-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Low confidence on: {parsedFields.low_confidence_fields.join(', ')} — please double-check.
                  </p>
                ) : null}
              </div>
            )}
          </Section>

          {/* SECTION 1 — Project Basics */}
          <Section title="1. Project Basics">
            <Label required>What type of developer do you need?</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {ROLE_OPTIONS.map(({ value, label, icon: Icon }) => (
                <label key={value} className={`flex flex-col items-center gap-2 p-4 rounded-xl border cursor-pointer text-center ${watch('role_type') === value ? 'border-[#2563EB] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" value={value} {...register('role_type')} className="sr-only" />
                  <Icon className={`w-6 h-6 ${watch('role_type') === value ? 'text-[#2563EB]' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </label>
              ))}
            </div>
            {errors.role_type && <p className="text-sm text-red-600 mb-2">{errors.role_type.message}</p>}

            <Label required>Project title</Label>
            <input {...register('title')} className={inputCls} placeholder="React developer for fintech dashboard" />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}

            <Label required className="mt-4">Describe what you need</Label>
            <textarea {...register('description')} rows={4} className={`${inputCls} resize-none`}
              placeholder="e.g. We need a React developer to build our customer dashboard MVP. Auth, charts, export to PDF. Figma ready." />
            <div className="flex justify-between mt-1">
              {errors.description ? <p className="text-sm text-red-600">{errors.description.message}</p> : <span />}
              <span className={`text-xs ${description.length < 50 ? 'text-gray-400' : 'text-green-600'}`}>{description.length} / 50 min</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <Label required>Project type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['fixed', 'hourly'] as const).map((t) => (
                    <label key={t} className={`p-2.5 rounded-lg border cursor-pointer text-sm text-center capitalize ${watch('project_type') === t ? 'border-[#2563EB] bg-blue-50' : 'border-gray-200'}`}>
                      <input type="radio" value={t} {...register('project_type')} className="sr-only" />
                      {t === 'fixed' ? 'Fixed price' : 'Hourly'}
                    </label>
                  ))}
                </div>
                {errors.project_type && <p className="mt-1 text-sm text-red-600">{errors.project_type.message}</p>}
              </div>
              <div>
                <Label required>Experience level</Label>
                <select {...register('experience_level_required')} className={inputCls}>
                  <option value="">Select</option>
                  {EXPERIENCE_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
                {errors.experience_level_required && <p className="mt-1 text-sm text-red-600">{errors.experience_level_required.message}</p>}
              </div>
            </div>

            <div className="mt-4">
              <Label required>Priority</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['urgent', 'high', 'standard'] as BriefPriorityValue[]).map((p) => (
                  <label key={p} className={`p-2.5 rounded-lg border cursor-pointer text-sm text-center capitalize ${watch('priority') === p ? 'border-[#2563EB] bg-blue-50' : 'border-gray-200'}`}>
                    <input type="radio" value={p} {...register('priority')} className="sr-only" />{p}
                  </label>
                ))}
              </div>
            </div>
          </Section>

          {/* SECTION 2 — Requirements */}
          <Section title="2. Requirements">
            <Label>Tech stack <span className="font-normal text-gray-400">(optional)</span></Label>
            <p className="text-xs text-gray-500 mb-2">Leave blank if unsure — we&apos;ll suggest based on your description.</p>
            <SkillTaxonomyPicker mode="brief" value={skillTags} onChange={handleSkillTagsChange} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div>
                <Label required>Duration</Label>
                <select {...register('duration_weeks')} className={inputCls}>
                  <option value="">Select</option>
                  {DURATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {errors.duration_weeks && <p className="mt-1 text-sm text-red-600">Required</p>}
              </div>
              <div>
                <Label required>Hours / week</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[20, 40].map((h) => (
                    <label key={h} className={`p-2.5 rounded-lg border cursor-pointer text-sm text-center ${watch('weekly_hours') === h ? 'border-[#2563EB] bg-blue-50' : 'border-gray-200'}`}>
                      <input type="radio" value={h} {...register('weekly_hours')} className="sr-only" />{h}
                    </label>
                  ))}
                </div>
                {errors.weekly_hours && <p className="mt-1 text-sm text-red-600">Required</p>}
              </div>
              <div>
                <Label>Start date</Label>
                <input type="date" {...register('start_date')} className={inputCls} />
              </div>
            </div>
          </Section>

          {/* SECTION 3 — Budget */}
          <Section title="3. Budget">
            <p className="text-xs text-gray-500 mb-3">Our developers typically charge ₹80,000–₹4,00,000/month. Leave blank if unsure.</p>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" {...register('budget_min')} placeholder="Min" className={inputCls} />
              <input type="number" {...register('budget_max')} placeholder="Max" className={inputCls} />
            </div>
            <label className="flex items-center gap-3 mt-4 cursor-pointer">
              <input type="checkbox" {...register('is_negotiable')} className="h-4 w-4 rounded border-gray-300" />
              <span className="text-sm text-gray-700">Open to negotiation on rate &amp; start date</span>
            </label>
          </Section>

          {/* SECTION 4 — Attachments */}
          <Section title="4. Attachments">
            <p className="text-xs text-gray-500 mb-3">Spec docs, brand assets, or a Figma link. Shown to admin and your matched developer.</p>
            <FileUpload kind="brief-attachment" accept="image/*,application/pdf,.doc,.docx"
              label="Upload a file"
              onUploaded={({ url, fileName, fileType }) => {
                if (url) setAttachments((a) => [...a, { file_url: url, file_name: fileName, file_type: fileType.includes('pdf') ? 'pdf' : fileType.startsWith('image') ? 'image' : 'file' }])
              }} />
            <div className="flex gap-2 mt-3">
              <input value={figmaLink} onChange={(e) => setFigmaLink(e.target.value)} placeholder="Paste a Figma link" className={inputCls} />
              <button type="button" onClick={addFigmaLink} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 shrink-0">Add</button>
            </div>
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((a, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm">
                    <span className="flex items-center gap-2 text-gray-700 truncate"><FileText className="w-4 h-4 shrink-0" /> {a.file_name}</span>
                    <button type="button" onClick={() => setAttachments((arr) => arr.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* SECTION 5 — Company Details */}
          <Section title="5. Company Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label required>Company name</Label>
                <input {...register('company_name')} className={inputCls} placeholder="Acme Inc." />
                {errors.company_name && <p className="mt-1 text-sm text-red-600">{errors.company_name.message}</p>}
              </div>
              <div>
                <Label required>Your name</Label>
                <input {...register('contact_name')} className={inputCls} placeholder="Rahul Gupta" />
                {errors.contact_name && <p className="mt-1 text-sm text-red-600">{errors.contact_name.message}</p>}
              </div>
              <div>
                <Label required>Email</Label>
                <input type="email" {...register('email')} className={inputCls} placeholder="rahul@company.com" />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>
              <div>
                <Label>How did you hear about us?</Label>
                <select {...register('referral')} className={inputCls}>
                  <option value="">Select</option>
                  {REFERRAL_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </Section>

          {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

          <button type="submit" disabled={submitting}
            className="w-full flex justify-center items-center gap-2 py-3.5 bg-[#2563EB] text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-60">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Submitting…' : 'Find me a developer →'}
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {[
              { icon: Clock, text: '3 verified profiles within 24 hours' },
              { icon: ShieldCheck, text: 'No commitment until you sign' },
              { icon: CheckCircle, text: 'Pay only after milestone approval' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-xs text-gray-500">
                <Icon className="w-4 h-4 text-[#2563EB] shrink-0" />{text}
              </div>
            ))}
          </div>
        </form>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">{title}</h2>
      {children}
    </div>
  )
}
function Label({ children, required, className = '' }: { children: React.ReactNode; required?: boolean; className?: string }) {
  return <label className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}>{children}{required && ' *'}</label>
}
