create index if not exists igr_v45_lawyer_dismissals_suspect_idx
  on public.igr_v45_lawyer_dismissals(suspect_id);
create index if not exists igr_v45_lawyer_dismissals_lawyer_idx
  on public.igr_v45_lawyer_dismissals(lawyer_id);
