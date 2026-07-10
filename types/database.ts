export interface Database {
  public: {
    Tables: {
      developers: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          full_name: string
          email: string
          phone: string | null
          city: string
          linkedin_url: string
          github_url: string | null
          portfolio_url: string | null
          cv_url: string | null
          primary_role: 'Full-Stack' | 'Cloud' | 'Both'
          years_exp: number
          tech_stack: string[]
          available_from: string | null
          weekly_hours: 20 | 40 | null
          monthly_rate_min: number | null
          monthly_rate_max: number | null
          status: DeveloperStatusValue
          vetting_notes: string | null
          vetted_at: string | null
          vetted_by: string | null
          tier: 'Standard' | 'Senior' | 'Lead' | null
          slug: string | null
          is_visible: boolean
          profile_score: number | null
          total_engagements: number
          // Change #1 additions
          date_of_birth: string | null
          gender: 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say' | null
          state: string | null
          country: string | null
          job_interests: string[] | null
          location_interests: string[] | null
          video_intro_url: string | null
          id_document_type: 'Aadhaar' | 'PAN' | 'Passport' | 'Driving License' | null
          id_document_url: string | null
          id_document_last4: string | null
          id_verification_status: IdVerificationStatusValue
          kyc_provider: string | null
          kyc_reference_id: string | null
          kyc_verified_at: string | null
          kyc_rejection_reason: string | null
          // Design Change #2 additions
          source_type: SourceTypeValue
          sourced_by_partner_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          full_name: string
          email: string
          phone?: string | null
          city?: string
          linkedin_url: string
          github_url?: string | null
          portfolio_url?: string | null
          cv_url?: string | null
          primary_role: 'Full-Stack' | 'Cloud' | 'Both'
          years_exp: number
          tech_stack: string[]
          available_from?: string | null
          weekly_hours?: 20 | 40 | null
          monthly_rate_min?: number | null
          monthly_rate_max?: number | null
          status?: DeveloperStatusValue
          vetting_notes?: string | null
          vetted_at?: string | null
          vetted_by?: string | null
          tier?: 'Standard' | 'Senior' | 'Lead' | null
          slug?: string | null
          is_visible?: boolean
          profile_score?: number | null
          total_engagements?: number
          date_of_birth?: string | null
          gender?: 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say' | null
          state?: string | null
          country?: string | null
          job_interests?: string[] | null
          location_interests?: string[] | null
          video_intro_url?: string | null
          id_document_type?: 'Aadhaar' | 'PAN' | 'Passport' | 'Driving License' | null
          id_document_url?: string | null
          id_document_last4?: string | null
          id_verification_status?: IdVerificationStatusValue
          kyc_provider?: string | null
          kyc_reference_id?: string | null
          kyc_verified_at?: string | null
          kyc_rejection_reason?: string | null
          source_type?: SourceTypeValue
          sourced_by_partner_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['developers']['Insert']>
      }
      developer_work_history: {
        Row: {
          id: string
          developer_id: string | null
          company_name: string
          role_title: string
          start_date: string | null
          end_date: string | null
          description: string | null
          client_reference_name: string | null
          client_reference_contact: string | null
        }
        Insert: {
          id?: string
          developer_id?: string | null
          company_name: string
          role_title: string
          start_date?: string | null
          end_date?: string | null
          description?: string | null
          client_reference_name?: string | null
          client_reference_contact?: string | null
        }
        Update: Partial<Database['public']['Tables']['developer_work_history']['Insert']>
      }
      developer_portfolio_items: {
        Row: {
          id: string
          developer_id: string | null
          title: string
          description: string | null
          project_url: string | null
          image_url: string | null
          tech_stack: string[] | null
          display_order: number
        }
        Insert: {
          id?: string
          developer_id?: string | null
          title: string
          description?: string | null
          project_url?: string | null
          image_url?: string | null
          tech_stack?: string[] | null
          display_order?: number
        }
        Update: Partial<Database['public']['Tables']['developer_portfolio_items']['Insert']>
      }
      developer_certifications: {
        Row: {
          id: string
          developer_id: string | null
          name: string
          issuing_body: string | null
          issue_date: string | null
          expiry_date: string | null
          certificate_file_url: string | null
          verified: boolean
        }
        Insert: {
          id?: string
          developer_id?: string | null
          name: string
          issuing_body?: string | null
          issue_date?: string | null
          expiry_date?: string | null
          certificate_file_url?: string | null
          verified?: boolean
        }
        Update: Partial<Database['public']['Tables']['developer_certifications']['Insert']>
      }
      developer_skill_tests: {
        Row: {
          id: string
          developer_id: string | null
          skill_name: string
          test_provider: string
          score: number | null
          max_score: number | null
          test_date: string | null
          certificate_url: string | null
        }
        Insert: {
          id?: string
          developer_id?: string | null
          skill_name: string
          test_provider?: string
          score?: number | null
          max_score?: number | null
          test_date?: string | null
          certificate_url?: string | null
        }
        Update: Partial<Database['public']['Tables']['developer_skill_tests']['Insert']>
      }
      developer_references: {
        Row: {
          id: string
          developer_id: string | null
          reference_name: string
          reference_email: string | null
          reference_phone: string | null
          relationship: string | null
          company_name: string | null
          contacted_status: 'not_contacted' | 'contacted' | 'verified' | 'unreachable'
          notes: string | null
        }
        Insert: {
          id?: string
          developer_id?: string | null
          reference_name: string
          reference_email?: string | null
          reference_phone?: string | null
          relationship?: string | null
          company_name?: string | null
          contacted_status?: 'not_contacted' | 'contacted' | 'verified' | 'unreachable'
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['developer_references']['Insert']>
      }
      developer_rate_cards: {
        Row: {
          id: string
          developer_id: string | null
          skill_or_role: string
          engagement_type: 'hourly' | 'project' | 'monthly' | null
          rate_amount: number | null
          notes: string | null
        }
        Insert: {
          id?: string
          developer_id?: string | null
          skill_or_role: string
          engagement_type?: 'hourly' | 'project' | 'monthly' | null
          rate_amount?: number | null
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['developer_rate_cards']['Insert']>
      }
      brief_attachments: {
        Row: {
          id: string
          brief_id: string | null
          file_url: string
          file_name: string | null
          file_type: string | null
          uploaded_at: string
          parsed_fields: ParsedBriefFields | null
        }
        Insert: {
          id?: string
          brief_id?: string | null
          file_url: string
          file_name?: string | null
          file_type?: string | null
          uploaded_at?: string
          parsed_fields?: ParsedBriefFields | null
        }
        Update: Partial<Database['public']['Tables']['brief_attachments']['Insert']>
      }
      skill_domains: {
        Row: { id: string; name: string }
        Insert: { id?: string; name: string }
        Update: Partial<Database['public']['Tables']['skill_domains']['Insert']>
      }
      skill_subdisciplines: {
        Row: { id: string; domain_id: string; name: string }
        Insert: { id?: string; domain_id: string; name: string }
        Update: Partial<Database['public']['Tables']['skill_subdisciplines']['Insert']>
      }
      skill_tools: {
        Row: { id: string; subdiscipline_id: string; name: string }
        Insert: { id?: string; subdiscipline_id: string; name: string }
        Update: Partial<Database['public']['Tables']['skill_tools']['Insert']>
      }
      developer_skill_tags: {
        Row: {
          id: string
          developer_id: string
          skill_tool_id: string
          proficiency_tier: ProficiencyTierValue
          evidence_type: EvidenceTypeValue
          evidence_ref: string | null
          created_at: string
        }
        Insert: {
          id?: string
          developer_id: string
          skill_tool_id: string
          proficiency_tier?: ProficiencyTierValue
          evidence_type?: EvidenceTypeValue
          evidence_ref?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['developer_skill_tags']['Insert']>
      }
      brief_skill_tags: {
        Row: {
          id: string
          brief_id: string
          skill_tool_id: string
          requirement_type: RequirementTypeValue
        }
        Insert: {
          id?: string
          brief_id: string
          skill_tool_id: string
          requirement_type?: RequirementTypeValue
        }
        Update: Partial<Database['public']['Tables']['brief_skill_tags']['Insert']>
      }
      scoring_weights: {
        Row: {
          id: string
          skill_weight: number
          location_weight: number
          trust_weight: number
          rating_weight: number
          updated_at: string
        }
        Insert: {
          id?: string
          skill_weight?: number
          location_weight?: number
          trust_weight?: number
          rating_weight?: number
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['scoring_weights']['Insert']>
      }
      skill_match_credit: {
        Row: { id: string; match_type: SkillMatchTypeValue; credit_multiplier: number }
        Insert: { id?: string; match_type: SkillMatchTypeValue; credit_multiplier: number }
        Update: Partial<Database['public']['Tables']['skill_match_credit']['Insert']>
      }
      match_scores: {
        Row: {
          id: string
          developer_id: string
          brief_id: string
          skill_score: number
          location_score: number
          trust_score: number
          rating_score: number
          overall_score: number
          reason_text: string | null
          computed_at: string
        }
        Insert: {
          id?: string
          developer_id: string
          brief_id: string
          skill_score?: number
          location_score?: number
          trust_score?: number
          rating_score?: number
          overall_score?: number
          reason_text?: string | null
          computed_at?: string
        }
        Update: Partial<Database['public']['Tables']['match_scores']['Insert']>
      }
      sourcing_partners: {
        Row: {
          id: string
          name: string
          contact_email: string | null
          type: SourcingPartnerTypeValue
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          contact_email?: string | null
          type: SourcingPartnerTypeValue
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['sourcing_partners']['Insert']>
      }
      candidate_events: {
        Row: {
          id: string
          developer_id: string
          event_type: string
          actor_type: ActorTypeValue
          actor_id: string | null
          metadata: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          developer_id: string
          event_type: string
          actor_type: ActorTypeValue
          actor_id?: string | null
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['candidate_events']['Insert']>
      }
      company_users: {
        Row: {
          id: string
          buyer_id: string
          email: string
          role: CompanyRoleValue
          invited_at: string
          joined_at: string | null
        }
        Insert: {
          id?: string
          buyer_id: string
          email: string
          role?: CompanyRoleValue
          invited_at?: string
          joined_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['company_users']['Insert']>
      }
      candidate_screening_ratings: {
        Row: {
          id: string
          brief_id: string
          developer_id: string
          rated_by: string | null
          profile_quality: number
          presentability: number
          responsiveness: number
          expectation_match: number
          notes: string | null
          created_at: string
          locked_at: string | null
        }
        Insert: {
          id?: string
          brief_id: string
          developer_id: string
          rated_by?: string | null
          profile_quality: number
          presentability: number
          responsiveness: number
          expectation_match: number
          notes?: string | null
          created_at?: string
          locked_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['candidate_screening_ratings']['Insert']>
      }
      offer_links: {
        Row: {
          id: string
          brief_negotiation_id: string
          token: string
          expires_at: string
          used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          brief_negotiation_id: string
          token: string
          expires_at: string
          used_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['offer_links']['Insert']>
      }
      brief_negotiations: {
        Row: {
          id: string
          brief_id: string | null
          shortlist_id: string | null
          proposed_by: 'buyer' | 'developer' | 'admin'
          proposed_rate: number | null
          proposed_start_date: string | null
          message: string | null
          status: 'pending' | 'accepted' | 'rejected' | 'countered'
          created_at: string
        }
        Insert: {
          id?: string
          brief_id?: string | null
          shortlist_id?: string | null
          proposed_by: 'buyer' | 'developer' | 'admin'
          proposed_rate?: number | null
          proposed_start_date?: string | null
          message?: string | null
          status?: 'pending' | 'accepted' | 'rejected' | 'countered'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['brief_negotiations']['Insert']>
      }
      buyers: {
        Row: {
          id: string
          created_at: string
          user_id: string | null
          company_name: string
          company_email: string
          website: string | null
          company_size: '1-10' | '11-50' | '51-200' | '200+' | null
          stage: 'Idea' | 'Pre-Seed' | 'Seed' | 'Series A' | 'Series B+' | 'SME' | null
          industry: string | null
          contact_name: string
          contact_role: string | null
          subscription_tier: 'free' | 'growth' | 'portfolio'
          subscription_until: string | null
          total_engagements: number
          // Design Change #2 additions
          email_domain_verified: boolean
          email_verification_token: string | null
          email_verification_expires_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id?: string | null
          company_name: string
          company_email: string
          website?: string | null
          company_size?: '1-10' | '11-50' | '51-200' | '200+' | null
          stage?: 'Idea' | 'Pre-Seed' | 'Seed' | 'Series A' | 'Series B+' | 'SME' | null
          industry?: string | null
          contact_name: string
          contact_role?: string | null
          subscription_tier?: 'free' | 'growth' | 'portfolio'
          subscription_until?: string | null
          total_engagements?: number
          email_domain_verified?: boolean
          email_verification_token?: string | null
          email_verification_expires_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['buyers']['Insert']>
      }
      briefs: {
        Row: {
          id: string
          created_at: string
          buyer_id: string | null
          role_type: 'Full-Stack' | 'Cloud' | 'DevOps' | 'Both'
          title: string
          description: string
          tech_stack: string[] | null
          duration_weeks: number
          weekly_hours: 20 | 40 | null
          start_date: string | null
          budget_min: number | null
          budget_max: number | null
          status: BriefStatusValue
          matched_at: string | null
          // Change #1 additions
          project_type: 'fixed' | 'hourly' | null
          experience_level_required: 'Junior' | 'Mid' | 'Senior' | 'Any' | null
          is_negotiable: boolean
          // Design Change #2 additions
          priority: BriefPriorityValue
          source_type: BriefSourceTypeValue
        }
        Insert: {
          id?: string
          created_at?: string
          buyer_id?: string | null
          role_type: 'Full-Stack' | 'Cloud' | 'DevOps' | 'Both'
          title: string
          description: string
          tech_stack?: string[] | null
          duration_weeks: number
          weekly_hours?: 20 | 40 | null
          start_date?: string | null
          budget_min?: number | null
          budget_max?: number | null
          status?: BriefStatusValue
          matched_at?: string | null
          project_type?: 'fixed' | 'hourly' | null
          experience_level_required?: 'Junior' | 'Mid' | 'Senior' | 'Any' | null
          is_negotiable?: boolean
          priority?: BriefPriorityValue
          source_type?: BriefSourceTypeValue
        }
        Update: Partial<Database['public']['Tables']['briefs']['Insert']>
      }
      shortlists: {
        Row: {
          id: string
          created_at: string
          brief_id: string | null
          developer_id: string | null
          position: 1 | 2 | 3 | null
          status: 'pending' | 'accepted' | 'declined' | 'contracted'
        }
        Insert: {
          id?: string
          created_at?: string
          brief_id?: string | null
          developer_id?: string | null
          position?: 1 | 2 | 3 | null
          status?: 'pending' | 'accepted' | 'declined' | 'contracted'
        }
        Update: Partial<Database['public']['Tables']['shortlists']['Insert']>
      }
      engagements: {
        Row: {
          id: string
          created_at: string
          brief_id: string | null
          developer_id: string | null
          buyer_id: string | null
          start_date: string
          end_date: string | null
          weekly_hours: number | null
          monthly_rate: number
          platform_fee_pct: number
          status: EngagementStatusValue
          weekly_updates: WeeklyUpdate[]
          rating_quality: number | null
          rating_communication: number | null
          rating_deadlines: number | null
          rating_scope: number | null
          rating_rehire: number | null
          rating_overall: number | null
          rating_comment: string | null
          rated_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          brief_id?: string | null
          developer_id?: string | null
          buyer_id?: string | null
          start_date: string
          end_date?: string | null
          weekly_hours?: number | null
          monthly_rate: number
          platform_fee_pct?: number
          status?: EngagementStatusValue
          weekly_updates?: WeeklyUpdate[]
          rating_quality?: number | null
          rating_communication?: number | null
          rating_deadlines?: number | null
          rating_scope?: number | null
          rating_rehire?: number | null
          rating_overall?: number | null
          rating_comment?: string | null
          rated_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['engagements']['Insert']>
      }
      milestones: {
        Row: {
          id: string
          engagement_id: string | null
          title: string
          description: string | null
          due_date: string | null
          amount_inr: number
          status: MilestoneStatusValue
          submitted_at: string | null
          approved_at: string | null
          paid_at: string | null
          razorpay_payment_id: string | null
        }
        Insert: {
          id?: string
          engagement_id?: string | null
          title: string
          description?: string | null
          due_date?: string | null
          amount_inr: number
          status?: MilestoneStatusValue
          submitted_at?: string | null
          approved_at?: string | null
          paid_at?: string | null
          razorpay_payment_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['milestones']['Insert']>
      }
    }
  }
}

// ── Status value types ──────────────────────────────────────
export type DeveloperStatusValue =
  | 'applied'
  | 'screening'
  | 'code_test'
  | 'design_call'
  | 'reference_check'
  | 'approved'
  | 'rejected'
  | 'suspended'

export type BriefStatusValue =
  | 'open'
  | 'matching'
  | 'shortlisted'
  | 'contracted'
  | 'closed'
  | 'cancelled'

export type EngagementStatusValue =
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'disputed'

export type MilestoneStatusValue =
  | 'pending'
  | 'submitted'
  | 'approved'
  | 'paid'
  | 'disputed'

export type IdVerificationStatusValue =
  | 'not_started'
  | 'pending'
  | 'verified'
  | 'rejected'

export type NegotiationStatusValue =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'countered'

// Design Change #2 value types
export type SourceTypeValue =
  | 'self_signup'
  | 'staffing_partner'
  | 'field_recruiter'
  | 'referral'
  | 'bulk_import'

export type SourcingPartnerTypeValue =
  | 'staffing_partner'
  | 'field_recruiter'
  | 'referral_program'

export type ActorTypeValue = 'system' | 'candidate' | 'admin' | 'partner'

export type ProficiencyTierValue = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export type EvidenceTypeValue =
  | 'self_declared'
  | 'portfolio'
  | 'certification'
  | 'skill_test'
  | 'engagement_history'

export type RequirementTypeValue = 'required' | 'preferred'

export type SkillMatchTypeValue =
  | 'exact'
  | 'same_subdiscipline'
  | 'same_domain'
  | 'different_domain'

export type BriefPriorityValue = 'urgent' | 'high' | 'standard'

export type BriefSourceTypeValue =
  | 'manual_form'
  | 'pdf_upload'
  | 'doc_upload'
  | 'forwarded_email'

export type CompanyRoleValue = 'owner' | 'admin' | 'viewer'

export interface ParsedBriefFields {
  role_type?: string
  tech_stack?: string[]
  duration_weeks?: number
  budget_min?: number
  budget_max?: number
  experience_level_required?: string
  confidence?: 'high' | 'medium' | 'low'
  low_confidence_fields?: string[]
}

// ── Convenience aliases ─────────────────────────────────────
export type Developer = Database['public']['Tables']['developers']['Row']
export type DeveloperInsert = Database['public']['Tables']['developers']['Insert']
export type Buyer = Database['public']['Tables']['buyers']['Row']
export type BuyerInsert = Database['public']['Tables']['buyers']['Insert']
export type Brief = Database['public']['Tables']['briefs']['Row']
export type BriefInsert = Database['public']['Tables']['briefs']['Insert']
export type Shortlist = Database['public']['Tables']['shortlists']['Row']
export type Engagement = Database['public']['Tables']['engagements']['Row']
export type EngagementInsert = Database['public']['Tables']['engagements']['Insert']
export type Milestone = Database['public']['Tables']['milestones']['Row']

// Change #1 aliases
export type WorkHistory = Database['public']['Tables']['developer_work_history']['Row']
export type WorkHistoryInsert = Database['public']['Tables']['developer_work_history']['Insert']
export type PortfolioItem = Database['public']['Tables']['developer_portfolio_items']['Row']
export type PortfolioItemInsert = Database['public']['Tables']['developer_portfolio_items']['Insert']
export type Certification = Database['public']['Tables']['developer_certifications']['Row']
export type CertificationInsert = Database['public']['Tables']['developer_certifications']['Insert']
export type SkillTest = Database['public']['Tables']['developer_skill_tests']['Row']
export type SkillTestInsert = Database['public']['Tables']['developer_skill_tests']['Insert']
export type DeveloperReference = Database['public']['Tables']['developer_references']['Row']
export type DeveloperReferenceInsert = Database['public']['Tables']['developer_references']['Insert']
export type RateCard = Database['public']['Tables']['developer_rate_cards']['Row']
export type RateCardInsert = Database['public']['Tables']['developer_rate_cards']['Insert']
export type BriefAttachment = Database['public']['Tables']['brief_attachments']['Row']
export type BriefAttachmentInsert = Database['public']['Tables']['brief_attachments']['Insert']
export type BriefNegotiation = Database['public']['Tables']['brief_negotiations']['Row']
export type BriefNegotiationInsert = Database['public']['Tables']['brief_negotiations']['Insert']

// Design Change #2 aliases
export type SkillDomain = Database['public']['Tables']['skill_domains']['Row']
export type SkillSubdiscipline = Database['public']['Tables']['skill_subdisciplines']['Row']
export type SkillTool = Database['public']['Tables']['skill_tools']['Row']
export type DeveloperSkillTag = Database['public']['Tables']['developer_skill_tags']['Row']
export type DeveloperSkillTagInsert = Database['public']['Tables']['developer_skill_tags']['Insert']
export type BriefSkillTag = Database['public']['Tables']['brief_skill_tags']['Row']
export type BriefSkillTagInsert = Database['public']['Tables']['brief_skill_tags']['Insert']
export type ScoringWeights = Database['public']['Tables']['scoring_weights']['Row']
export type SkillMatchCredit = Database['public']['Tables']['skill_match_credit']['Row']
export type MatchScore = Database['public']['Tables']['match_scores']['Row']
export type MatchScoreInsert = Database['public']['Tables']['match_scores']['Insert']
export type SourcingPartner = Database['public']['Tables']['sourcing_partners']['Row']
export type CandidateEvent = Database['public']['Tables']['candidate_events']['Row']
export type CandidateEventInsert = Database['public']['Tables']['candidate_events']['Insert']
export type CompanyUser = Database['public']['Tables']['company_users']['Row']
export type CompanyUserInsert = Database['public']['Tables']['company_users']['Insert']
export type CandidateScreeningRating = Database['public']['Tables']['candidate_screening_ratings']['Row']
export type CandidateScreeningRatingInsert = Database['public']['Tables']['candidate_screening_ratings']['Insert']
export type OfferLink = Database['public']['Tables']['offer_links']['Row']
export type OfferLinkInsert = Database['public']['Tables']['offer_links']['Insert']

// Taxonomy tree shape used by the SkillTaxonomyPicker component
export type SkillToolWithPath = SkillTool & {
  subdiscipline_name: string
  domain_name: string
  domain_id: string
}

// Ranked candidate row returned by GET /api/briefs/[id]/candidates
export type RankedCandidate = MatchScore & {
  developer: Pick<
    Developer,
    'id' | 'full_name' | 'slug' | 'primary_role' | 'tech_stack' | 'tier' |
    'monthly_rate_min' | 'monthly_rate_max' | 'location_interests' | 'city' | 'profile_score'
  >
}

// Full profile with all Change #1 child collections
export type DeveloperFullProfile = Developer & {
  work_history?: WorkHistory[]
  portfolio?: PortfolioItem[]
  certifications?: Certification[]
  skill_tests?: SkillTest[]
  references?: DeveloperReference[]
  rate_cards?: RateCard[]
}

// ── Enum-style const objects ────────────────────────────────
export const DEVELOPER_STATUS = {
  APPLIED: 'applied',
  SCREENING: 'screening',
  CODE_TEST: 'code_test',
  DESIGN_CALL: 'design_call',
  REFERENCE_CHECK: 'reference_check',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
} as const

export const BRIEF_STATUS = {
  OPEN: 'open',
  MATCHING: 'matching',
  SHORTLISTED: 'shortlisted',
  CONTRACTED: 'contracted',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
} as const

export const ENGAGEMENT_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed',
} as const

export const MILESTONE_STATUS = {
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  PAID: 'paid',
  DISPUTED: 'disputed',
} as const

export const PRIMARY_ROLE = {
  FULL_STACK: 'Full-Stack',
  CLOUD: 'Cloud',
  BOTH: 'Both',
} as const

export const DEVELOPER_TIER = {
  STANDARD: 'Standard',
  SENIOR: 'Senior',
  LEAD: 'Lead',
} as const

export const ID_VERIFICATION_STATUS = {
  NOT_STARTED: 'not_started',
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
} as const

export const NEGOTIATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  COUNTERED: 'countered',
} as const

export const ID_DOCUMENT_TYPES = ['Aadhaar', 'PAN', 'Passport', 'Driving License'] as const
export const EXPERIENCE_LEVELS = ['Junior', 'Mid', 'Senior', 'Any'] as const
export const ENGAGEMENT_TYPES = ['hourly', 'project', 'monthly'] as const

export const COMPANY_ROLE = {
  OWNER: 'owner',
  ADMIN: 'admin',
  VIEWER: 'viewer',
} as const

export const BRIEF_PRIORITY = {
  URGENT: 'urgent',
  HIGH: 'high',
  STANDARD: 'standard',
} as const

export const BRIEF_SOURCE_TYPE = {
  MANUAL_FORM: 'manual_form',
  PDF_UPLOAD: 'pdf_upload',
  DOC_UPLOAD: 'doc_upload',
  FORWARDED_EMAIL: 'forwarded_email',
} as const

export const PROFICIENCY_TIER = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert',
} as const

// ── Extended types ──────────────────────────────────────────
export interface WeeklyUpdate {
  date: string
  text: string
  author: string
}

export type DeveloperWithEngagements = Developer & {
  engagements?: Engagement[]
}

export type ShortlistWithDeveloper = Shortlist & {
  developer?: Developer
}

export type BriefWithShortlist = Brief & {
  shortlists?: ShortlistWithDeveloper[]
}
