-- Defense in depth for the v45 dismissal ledger.
alter table public.igr_v45_lawyer_dismissals enable row level security;
revoke all on table public.igr_v45_lawyer_dismissals from public,anon,authenticated;
grant all on table public.igr_v45_lawyer_dismissals to service_role;
