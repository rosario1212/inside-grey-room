-- Inside Grey Room — harden historical v43/v44 tables.
-- These tables are accessed through controlled server functions and already expose
-- no direct DML privileges to anon/authenticated. Enable RLS as defense in depth
-- so a future GRANT cannot accidentally expose their rows without an explicit policy.

alter table public.igr_v43_lawyer_representations enable row level security;
alter table public.igr_v43_lawyer_requests enable row level security;
alter table public.igr_v44_judge_requests enable row level security;
alter table public.igr_v44_judge_reviews enable row level security;
alter table public.igr_v44_judge_summons enable row level security;
alter table public.igr_v44_lawyer_consultations enable row level security;
