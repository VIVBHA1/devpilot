-- Seed: 3 approved developers for testing
insert into developers (
  full_name, email, phone, city,
  linkedin_url, github_url,
  primary_role, years_exp, tech_stack,
  available_from, weekly_hours,
  monthly_rate_min, monthly_rate_max,
  status, tier, slug, is_visible, id_verification_status,
  vetted_at, vetted_by, profile_score, total_engagements
) values
(
  'Arjun Mehta', 'arjun.mehta@example.com', '+91 9876543210', 'Bengaluru',
  'https://linkedin.com/in/arjunmehta', 'https://github.com/arjunmehta',
  'Full-Stack', 6, ARRAY['React','Next.js','TypeScript','Node.js','PostgreSQL','AWS'],
  current_date + interval '7 days', 40,
  150000, 250000,
  'approved', 'Senior', 'arjun-mehta-a1b2', true, 'verified',
  now(), 'admin@devpilot.in', 4.8, 3
),
(
  'Priya Sharma', 'priya.sharma@example.com', '+91 9765432109', 'Hyderabad',
  'https://linkedin.com/in/priyasharma', 'https://github.com/priyasharma',
  'Cloud', 8, ARRAY['AWS','Terraform','Kubernetes','Docker','Python','CI/CD'],
  current_date + interval '14 days', 40,
  200000, 350000,
  'approved', 'Lead', 'priya-sharma-c3d4', true, 'verified',
  now(), 'admin@devpilot.in', 4.9, 5
),
(
  'Rohan Verma', 'rohan.verma@example.com', '+91 9654321098', 'Delhi-NCR',
  'https://linkedin.com/in/rohanverma', null,
  'Both', 4, ARRAY['React','Node.js','GCP','Docker','MongoDB','GraphQL'],
  current_date + interval '3 days', 20,
  80000, 140000,
  'approved', 'Standard', 'rohan-verma-e5f6', true, 'verified',
  now(), 'admin@devpilot.in', null, 0
);
