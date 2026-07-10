'use client'

import { useState } from 'react'
import { useForm, useFieldArray, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { ChevronRight, ChevronLeft, Loader2, Plus, Trash2, ShieldCheck } from 'lucide-react'
import { FileUpload } from '@/components/ui/FileUpload'

const TECH_STACK_OPTIONS = {
  Frontend: ['React', 'Next.js', 'Vue.js', 'Angular', 'TypeScript'],
  Backend: ['Node.js', 'Python', 'Java', 'Go', '.NET'],
  Database: ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis'],
  Cloud: ['AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform'],
  Other: ['GraphQL', 'REST APIs', 'CI/CD', 'Git'],
}
const CITIES = ['Bengaluru', 'Delhi-NCR', 'Mumbai', 'Hyderabad', 'Remote']
const JOB_INTERESTS = ['Full-Stack', 'Cloud', 'DevOps', 'Frontend', 'Backend', 'Data']
const LOCATION_INTERESTS = ['Remote', 'Bengaluru', 'Delhi-NCR', 'Mumbai', 'Hyderabad', 'Pune']
const ID_TYPES = ['Aadhaar', 'PAN', 'Passport', 'Driving License'] as const
const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'] as const
const ENGAGEMENT_TYPES = ['hourly', 'project', 'monthly'] as const

const schema = z.object({
  // Step 1 — Personal & Identity
  full_name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(GENDERS),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  linkedin_url: z.string().min(1, 'LinkedIn URL is required').refine((v) => v.includes('linkedin.com/in/'), 'Must be a linkedin.com/in/ URL'),
  github_url: z.string().optional(),
  portfolio_url: z.string().optional(),
  id_document_type: z.enum(ID_TYPES),
  id_document_path: z.string().min(1, 'Please upload your ID document'),
  id_document_last4: z.string().optional(),
  // Step 2 — Professional Profile
  primary_role: z.enum(['Full-Stack', 'Cloud', 'Both']),
  years_exp: z.coerce.number().min(1, 'Experience is required'),
  tech_stack: z.array(z.string()).min(1, 'Select at least one technology'),
  job_interests: z.array(z.string()).min(1, 'Select at least one'),
  location_interests: z.array(z.string()).min(1, 'Select at least one'),
  // Step 3 — Work History
  work_history: z.array(z.object({
    company_name: z.string().min(1, 'Company is required'),
    role_title: z.string().min(1, 'Role is required'),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    description: z.string().optional(),
  })).min(1, 'Add at least one role'),
  // Step 4 — Portfolio & Certifications
  portfolio: z.array(z.object({
    title: z.string().min(1, 'Title required'),
    description: z.string().optional(),
    project_url: z.string().optional(),
    image_url: z.string().optional(),
    tech_stack: z.string().optional(),
  })).optional(),
  certifications: z.array(z.object({
    name: z.string().min(1, 'Name required'),
    issuing_body: z.string().optional(),
    issue_date: z.string().optional(),
    expiry_date: z.string().optional(),
    certificate_file_url: z.string().optional(),
  })).optional(),
  skill_tests: z.array(z.object({
    skill_name: z.string().min(1, 'Skill required'),
    test_provider: z.string().optional(),
    score: z.coerce.number().optional(),
    max_score: z.coerce.number().optional(),
    test_date: z.string().optional(),
    certificate_url: z.string().optional(),
  })).optional(),
  // Step 5 — Rate Card & Availability
  rate_cards: z.array(z.object({
    skill_or_role: z.string().min(1, 'Required'),
    engagement_type: z.enum(ENGAGEMENT_TYPES),
    rate_amount: z.coerce.number().min(1, 'Rate required'),
  })).min(1, 'Add at least one rate card'),
  weekly_hours: z.coerce.number().refine((v) => v === 20 || v === 40, 'Select hours'),
  available_from: z.string().min(1, 'Available date is required'),
  // Step 6 — References & Video
  references: z.array(z.object({
    reference_name: z.string().min(1, 'Name required'),
    reference_email: z.string().optional(),
    reference_phone: z.string().optional(),
    relationship: z.string().optional(),
    company_name: z.string().optional(),
  })).min(1, 'Add at least one reference'),
  video_intro_url: z.string().optional(),
  // Step 7
  confirm_accurate: z.boolean().refine((v) => v, 'You must confirm accuracy'),
  confirm_terms: z.boolean().refine((v) => v, 'You must agree to terms'),
})

type FormData = z.infer<typeof schema>

const STEPS = [
  'Personal & Identity',
  'Professional',
  'Work History',
  'Portfolio & Certs',
  'Rate & Availability',
  'References & Video',
  'Review',
]

const inputCls = (err?: unknown) =>
  `w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${err ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}`

export default function ApplyPage() {
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      country: 'India',
      tech_stack: [],
      job_interests: [],
      location_interests: [],
      work_history: [{ company_name: '', role_title: '', start_date: '', end_date: '', description: '' }],
      portfolio: [],
      certifications: [],
      skill_tests: [],
      rate_cards: [{ skill_or_role: '', engagement_type: 'monthly', rate_amount: 0 }],
      references: [{ reference_name: '', reference_email: '', reference_phone: '', relationship: '', company_name: '' }],
      confirm_accurate: false,
      confirm_terms: false,
    },
  })
  const { register, handleSubmit, formState: { errors }, trigger, watch, setValue, getValues } = form

  const workHistory = useFieldArray({ control: form.control, name: 'work_history' })
  const portfolio = useFieldArray({ control: form.control, name: 'portfolio' })
  const certifications = useFieldArray({ control: form.control, name: 'certifications' })
  const skillTests = useFieldArray({ control: form.control, name: 'skill_tests' })
  const rateCards = useFieldArray({ control: form.control, name: 'rate_cards' })
  const references = useFieldArray({ control: form.control, name: 'references' })

  const toggleArray = (field: 'tech_stack' | 'job_interests' | 'location_interests', val: string) => {
    const cur = getValues(field)
    setValue(field, cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val], { shouldValidate: true })
  }

  const STEP_FIELDS: (keyof FormData)[][] = [
    ['full_name', 'email', 'date_of_birth', 'gender', 'city', 'state', 'country', 'linkedin_url', 'id_document_type', 'id_document_path'],
    ['primary_role', 'years_exp', 'tech_stack', 'job_interests', 'location_interests'],
    ['work_history'],
    [],
    ['rate_cards', 'weekly_hours', 'available_from'],
    ['references'],
    ['confirm_accurate', 'confirm_terms'],
  ]

  const handleNext = async () => {
    const valid = await trigger(STEP_FIELDS[step])
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/developers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Submission failed')
      }
      router.push('/apply/success')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setSubmitting(false)
    }
  }

  const techStack = watch('tech_stack')
  const jobInterests = watch('job_interests')
  const locationInterests = watch('location_interests')
  const values = getValues()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Apply to DevPilot</h1>
          <p className="mt-2 text-gray-600">Build your verified developer profile</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#2563EB]">Step {step + 1} of {STEPS.length}</span>
            <span className="text-sm text-gray-500">{STEPS[step]}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#2563EB] transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

            {/* ── STEP 1: Personal & Identity ── */}
            {step === 0 && (
              <div className="space-y-5">
                <h2 className="text-xl font-semibold text-gray-900">Personal &amp; Identity</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name *" error={errors.full_name?.message}>
                    <input {...register('full_name')} className={inputCls(errors.full_name)} placeholder="Arjun Mehta" />
                  </Field>
                  <Field label="Email *" error={errors.email?.message}>
                    <input type="email" {...register('email')} className={inputCls(errors.email)} placeholder="arjun@example.com" />
                  </Field>
                  <Field label="Phone" error={errors.phone?.message}>
                    <input {...register('phone')} className={inputCls()} placeholder="+91 98765 43210" />
                  </Field>
                  <Field label="Date of Birth *" error={errors.date_of_birth?.message}>
                    <input type="date" {...register('date_of_birth')} className={inputCls(errors.date_of_birth)} />
                  </Field>
                  <Field label="Gender *" error={errors.gender?.message}>
                    <select {...register('gender')} className={inputCls(errors.gender)}>
                      <option value="">Select</option>
                      {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </Field>
                  <Field label="City *" error={errors.city?.message}>
                    <select {...register('city')} className={inputCls(errors.city)}>
                      <option value="">Select city</option>
                      {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="State *" error={errors.state?.message}>
                    <input {...register('state')} className={inputCls(errors.state)} placeholder="Karnataka" />
                  </Field>
                  <Field label="Country *" error={errors.country?.message}>
                    <input {...register('country')} className={inputCls(errors.country)} />
                  </Field>
                </div>
                <Field label="LinkedIn URL *" error={errors.linkedin_url?.message}>
                  <input {...register('linkedin_url')} className={inputCls(errors.linkedin_url)} placeholder="https://linkedin.com/in/yourprofile" />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="GitHub URL"><input {...register('github_url')} className={inputCls()} placeholder="https://github.com/handle" /></Field>
                  <Field label="Portfolio URL"><input {...register('portfolio_url')} className={inputCls()} placeholder="https://yoursite.com" /></Field>
                </div>

                {/* Identity verification */}
                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
                    <h3 className="font-medium text-gray-900">Identity verification</h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    We verify every developer&apos;s government ID. Your document is stored privately and never shown on your profile.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="ID Type *" error={errors.id_document_type?.message}>
                      <select {...register('id_document_type')} className={inputCls(errors.id_document_type)}>
                        <option value="">Select</option>
                        {ID_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </Field>
                    <Field label="Last 4 digits of ID">
                      <input {...register('id_document_last4')} maxLength={4} className={inputCls()} placeholder="1234" />
                    </Field>
                  </div>
                  <div className="mt-3">
                    <FileUpload
                      kind="id-doc"
                      accept="image/*,application/pdf"
                      label="Upload government ID"
                      onUploaded={({ path }) => setValue('id_document_path', path, { shouldValidate: true })}
                    />
                    {errors.id_document_path && <p className="mt-1 text-sm text-red-600">{errors.id_document_path.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Professional Profile ── */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-xl font-semibold text-gray-900">Professional Profile</h2>
                <Field label="Primary Role *" error={errors.primary_role?.message}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(['Full-Stack', 'Cloud', 'Both'] as const).map((role) => (
                      <label key={role} className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer text-sm font-medium ${watch('primary_role') === role ? 'border-[#2563EB] bg-blue-50' : 'border-gray-200'}`}>
                        <input type="radio" value={role} {...register('primary_role')} className="sr-only" />
                        {role === 'Full-Stack' ? 'Full-Stack' : role === 'Cloud' ? 'Cloud / DevOps' : 'Both'}
                      </label>
                    ))}
                  </div>
                </Field>
                <Field label="Years of Experience *" error={errors.years_exp?.message}>
                  <select {...register('years_exp')} className={inputCls(errors.years_exp)}>
                    <option value="">Select</option>
                    <option value="1">1–2 years</option>
                    <option value="3">3–5 years</option>
                    <option value="6">6–10 years</option>
                    <option value="11">10+ years</option>
                  </select>
                </Field>
                <Field label="Tech Stack *" error={errors.tech_stack?.message}>
                  {Object.entries(TECH_STACK_OPTIONS).map(([cat, techs]) => (
                    <div key={cat} className="mb-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">{cat}</p>
                      <div className="flex flex-wrap gap-2">
                        {techs.map((t) => (
                          <Chip key={t} active={techStack.includes(t)} onClick={() => toggleArray('tech_stack', t)}>{t}</Chip>
                        ))}
                      </div>
                    </div>
                  ))}
                </Field>
                <Field label="Job Interests * (roles you want to be matched to)" error={errors.job_interests?.message}>
                  <div className="flex flex-wrap gap-2">
                    {JOB_INTERESTS.map((j) => <Chip key={j} active={jobInterests.includes(j)} onClick={() => toggleArray('job_interests', j)}>{j}</Chip>)}
                  </div>
                </Field>
                <Field label="Location Interests *" error={errors.location_interests?.message}>
                  <div className="flex flex-wrap gap-2">
                    {LOCATION_INTERESTS.map((l) => <Chip key={l} active={locationInterests.includes(l)} onClick={() => toggleArray('location_interests', l)}>{l}</Chip>)}
                  </div>
                </Field>
              </div>
            )}

            {/* ── STEP 3: Work History ── */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">Work History</h2>
                <p className="text-sm text-gray-500">Add the roles that best represent your experience. At least one required.</p>
                {typeof errors.work_history?.message === 'string' && <p className="text-sm text-red-600">{errors.work_history.message}</p>}
                {workHistory.fields.map((f, i) => (
                  <RepeatCard key={f.id} onRemove={workHistory.fields.length > 1 ? () => workHistory.remove(i) : undefined} index={i + 1}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Company *" error={errors.work_history?.[i]?.company_name?.message}>
                        <input {...register(`work_history.${i}.company_name`)} className={inputCls(errors.work_history?.[i]?.company_name)} />
                      </Field>
                      <Field label="Role Title *" error={errors.work_history?.[i]?.role_title?.message}>
                        <input {...register(`work_history.${i}.role_title`)} className={inputCls(errors.work_history?.[i]?.role_title)} />
                      </Field>
                      <Field label="Start Date"><input type="date" {...register(`work_history.${i}.start_date`)} className={inputCls()} /></Field>
                      <Field label="End Date (blank = current)"><input type="date" {...register(`work_history.${i}.end_date`)} className={inputCls()} /></Field>
                    </div>
                    <Field label="What you built / delivered">
                      <textarea {...register(`work_history.${i}.description`)} rows={2} className={inputCls()} />
                    </Field>
                  </RepeatCard>
                ))}
                <AddButton onClick={() => workHistory.append({ company_name: '', role_title: '', start_date: '', end_date: '', description: '' })}>Add another role</AddButton>
              </div>
            )}

            {/* ── STEP 4: Portfolio & Certifications ── */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Portfolio &amp; Certifications</h2>

                <section>
                  <h3 className="font-medium text-gray-900 mb-2">Portfolio projects</h3>
                  {portfolio.fields.map((f, i) => (
                    <RepeatCard key={f.id} onRemove={() => portfolio.remove(i)} index={i + 1}>
                      <Field label="Title *" error={errors.portfolio?.[i]?.title?.message}>
                        <input {...register(`portfolio.${i}.title`)} className={inputCls(errors.portfolio?.[i]?.title)} />
                      </Field>
                      <Field label="Description"><textarea {...register(`portfolio.${i}.description`)} rows={2} className={inputCls()} /></Field>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label="Live URL"><input {...register(`portfolio.${i}.project_url`)} className={inputCls()} placeholder="https://…" /></Field>
                        <Field label="Tech tags (comma-separated)"><input {...register(`portfolio.${i}.tech_stack`)} className={inputCls()} placeholder="React, Node" /></Field>
                      </div>
                      <div className="mt-1">
                        <FileUpload kind="portfolio" accept="image/*" label="Upload screenshot" compact
                          onUploaded={({ url }) => setValue(`portfolio.${i}.image_url`, url ?? '')} />
                      </div>
                    </RepeatCard>
                  ))}
                  <AddButton onClick={() => portfolio.append({ title: '', description: '', project_url: '', image_url: '', tech_stack: '' })}>Add project</AddButton>
                </section>

                <section>
                  <h3 className="font-medium text-gray-900 mb-2">Certifications</h3>
                  {certifications.fields.map((f, i) => (
                    <RepeatCard key={f.id} onRemove={() => certifications.remove(i)} index={i + 1}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label="Name *" error={errors.certifications?.[i]?.name?.message}>
                          <input {...register(`certifications.${i}.name`)} className={inputCls(errors.certifications?.[i]?.name)} placeholder="AWS Solutions Architect" />
                        </Field>
                        <Field label="Issuing Body"><input {...register(`certifications.${i}.issuing_body`)} className={inputCls()} /></Field>
                        <Field label="Issue Date"><input type="date" {...register(`certifications.${i}.issue_date`)} className={inputCls()} /></Field>
                        <Field label="Expiry Date"><input type="date" {...register(`certifications.${i}.expiry_date`)} className={inputCls()} /></Field>
                      </div>
                      <div className="mt-1">
                        <FileUpload kind="certificate" accept="image/*,application/pdf" label="Upload certificate" compact
                          onUploaded={({ url }) => setValue(`certifications.${i}.certificate_file_url`, url ?? '')} />
                      </div>
                    </RepeatCard>
                  ))}
                  <AddButton onClick={() => certifications.append({ name: '', issuing_body: '', issue_date: '', expiry_date: '', certificate_file_url: '' })}>Add certification</AddButton>
                </section>

                <section>
                  <h3 className="font-medium text-gray-900 mb-2">Skill tests <span className="text-xs font-normal text-gray-400">(self-reported scores)</span></h3>
                  {skillTests.fields.map((f, i) => (
                    <RepeatCard key={f.id} onRemove={() => skillTests.remove(i)} index={i + 1}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label="Skill *" error={errors.skill_tests?.[i]?.skill_name?.message}>
                          <input {...register(`skill_tests.${i}.skill_name`)} className={inputCls(errors.skill_tests?.[i]?.skill_name)} placeholder="React" />
                        </Field>
                        <Field label="Provider"><input {...register(`skill_tests.${i}.test_provider`)} className={inputCls()} placeholder="HackerRank" /></Field>
                        <Field label="Score"><input type="number" {...register(`skill_tests.${i}.score`)} className={inputCls()} /></Field>
                        <Field label="Max Score"><input type="number" {...register(`skill_tests.${i}.max_score`)} className={inputCls()} /></Field>
                      </div>
                    </RepeatCard>
                  ))}
                  <AddButton onClick={() => skillTests.append({ skill_name: '', test_provider: '', score: 0, max_score: 100, test_date: '', certificate_url: '' })}>Add skill test</AddButton>
                </section>
              </div>
            )}

            {/* ── STEP 5: Rate Card & Availability ── */}
            {step === 4 && (
              <div className="space-y-5">
                <h2 className="text-xl font-semibold text-gray-900">Rate Card &amp; Availability</h2>
                <p className="text-sm text-gray-500">List your rates. Your profile summary range is computed from these.</p>
                {typeof errors.rate_cards?.message === 'string' && <p className="text-sm text-red-600">{errors.rate_cards.message}</p>}
                {rateCards.fields.map((f, i) => (
                  <RepeatCard key={f.id} onRemove={rateCards.fields.length > 1 ? () => rateCards.remove(i) : undefined} index={i + 1}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Field label="Skill / Role *" error={errors.rate_cards?.[i]?.skill_or_role?.message}>
                        <input {...register(`rate_cards.${i}.skill_or_role`)} className={inputCls(errors.rate_cards?.[i]?.skill_or_role)} placeholder="React Development" />
                      </Field>
                      <Field label="Type *" error={errors.rate_cards?.[i]?.engagement_type?.message}>
                        <select {...register(`rate_cards.${i}.engagement_type`)} className={inputCls(errors.rate_cards?.[i]?.engagement_type)}>
                          {ENGAGEMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </Field>
                      <Field label="Rate (INR) *" error={errors.rate_cards?.[i]?.rate_amount?.message}>
                        <input type="number" {...register(`rate_cards.${i}.rate_amount`)} className={inputCls(errors.rate_cards?.[i]?.rate_amount)} placeholder="150000" />
                      </Field>
                    </div>
                  </RepeatCard>
                ))}
                <AddButton onClick={() => rateCards.append({ skill_or_role: '', engagement_type: 'monthly', rate_amount: 0 })}>Add rate card</AddButton>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <Field label="Weekly Hours *" error={errors.weekly_hours?.message}>
                    <div className="grid grid-cols-2 gap-2">
                      {[20, 40].map((h) => (
                        <label key={h} className={`p-2.5 rounded-lg border cursor-pointer text-sm text-center ${watch('weekly_hours') === h ? 'border-[#2563EB] bg-blue-50' : 'border-gray-200'}`}>
                          <input type="radio" value={h} {...register('weekly_hours')} className="sr-only" />
                          {h} hrs
                        </label>
                      ))}
                    </div>
                  </Field>
                  <Field label="Available From *" error={errors.available_from?.message}>
                    <input type="date" {...register('available_from')} min={new Date().toISOString().split('T')[0]} className={inputCls(errors.available_from)} />
                  </Field>
                </div>
              </div>
            )}

            {/* ── STEP 6: References & Video ── */}
            {step === 5 && (
              <div className="space-y-5">
                <h2 className="text-xl font-semibold text-gray-900">References &amp; Video Intro</h2>
                <p className="text-sm text-gray-500">At least one professional reference is required.</p>
                {typeof errors.references?.message === 'string' && <p className="text-sm text-red-600">{errors.references.message}</p>}
                {references.fields.map((f, i) => (
                  <RepeatCard key={f.id} onRemove={references.fields.length > 1 ? () => references.remove(i) : undefined} index={i + 1}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Name *" error={errors.references?.[i]?.reference_name?.message}>
                        <input {...register(`references.${i}.reference_name`)} className={inputCls(errors.references?.[i]?.reference_name)} />
                      </Field>
                      <Field label="Relationship"><input {...register(`references.${i}.relationship`)} className={inputCls()} placeholder="Manager" /></Field>
                      <Field label="Email"><input {...register(`references.${i}.reference_email`)} className={inputCls()} /></Field>
                      <Field label="Phone"><input {...register(`references.${i}.reference_phone`)} className={inputCls()} /></Field>
                      <Field label="Company"><input {...register(`references.${i}.company_name`)} className={inputCls()} /></Field>
                    </div>
                  </RepeatCard>
                ))}
                <AddButton onClick={() => references.append({ reference_name: '', reference_email: '', reference_phone: '', relationship: '', company_name: '' })}>Add reference</AddButton>

                <div className="pt-2">
                  <h3 className="font-medium text-gray-900 mb-1">Video intro <span className="text-xs font-normal text-gray-400">(optional, 30–60s)</span></h3>
                  <p className="text-xs text-gray-500 mb-2">A short self-recorded pitch, shown on your public profile if provided.</p>
                  <FileUpload kind="video" accept="video/*" label="Upload video intro"
                    onUploaded={({ url }) => setValue('video_intro_url', url ?? '')} />
                </div>
              </div>
            )}

            {/* ── STEP 7: Review & Submit ── */}
            {step === 6 && (
              <div className="space-y-5">
                <h2 className="text-xl font-semibold text-gray-900">Review &amp; Submit</h2>
                <div className="bg-gray-50 rounded-xl p-5 space-y-2 text-sm">
                  <ReviewRow label="Name" value={values.full_name} />
                  <ReviewRow label="Email" value={values.email} />
                  <ReviewRow label="Location" value={[values.city, values.state, values.country].filter(Boolean).join(', ')} />
                  <ReviewRow label="ID Document" value={values.id_document_type ? `${values.id_document_type} (uploaded)` : '—'} />
                  <ReviewRow label="Role" value={values.primary_role} />
                  <ReviewRow label="Tech Stack" value={values.tech_stack?.join(', ')} />
                  <ReviewRow label="Work History" value={`${values.work_history?.length ?? 0} role(s)`} />
                  <ReviewRow label="Portfolio" value={`${values.portfolio?.length ?? 0} project(s)`} />
                  <ReviewRow label="Certifications" value={`${values.certifications?.length ?? 0}`} />
                  <ReviewRow label="Rate Cards" value={`${values.rate_cards?.length ?? 0}`} />
                  <ReviewRow label="References" value={`${values.references?.length ?? 0}`} />
                  <ReviewRow label="Available From" value={values.available_from} />
                </div>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" {...register('confirm_accurate')} className="mt-0.5 h-4 w-4 rounded border-gray-300" />
                    <span className="text-sm text-gray-700">I confirm all information provided is accurate and complete.</span>
                  </label>
                  {errors.confirm_accurate && <p className="text-sm text-red-600">{errors.confirm_accurate.message}</p>}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" {...register('confirm_terms')} className="mt-0.5 h-4 w-4 rounded border-gray-300" />
                    <span className="text-sm text-gray-700">I agree to DevPilot&apos;s independent contractor terms.</span>
                  </label>
                  {errors.confirm_terms && <p className="text-sm text-red-600">{errors.confirm_terms.message}</p>}
                </div>
                {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            {step > 0 ? (
              <button type="button" onClick={() => setStep((s) => s - 1)} className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : <div />}
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={handleNext} className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-[#2563EB] rounded-lg hover:bg-blue-700">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-[#2563EB] rounded-lg hover:bg-blue-700 disabled:opacity-60">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Submitting…' : 'Submit Application'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Small building blocks ───────────────────────────────────
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${active ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'}`}>
      {children}
    </button>
  )
}
function RepeatCard({ index, onRemove, children }: { index: number; onRemove?: () => void; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 mb-3 space-y-3 relative">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400">#{index}</span>
        {onRemove && (
          <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
        )}
      </div>
      {children}
    </div>
  )
}
function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-1.5 text-sm font-medium text-[#2563EB] hover:text-blue-700">
      <Plus className="w-4 h-4" /> {children}
    </button>
  )
}
function ReviewRow({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="flex gap-3">
      <span className="w-32 shrink-0 text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium break-all">{value || '—'}</span>
    </div>
  )
}
