-- Preserve existing profile-deletion behavior: private campaign state must not
-- prevent its owner from deleting their account. No existing room is removed.
alter table igr_casino_private.casino_rooms
  drop constraint casino_rooms_owner_profile_id_fkey,
  add constraint casino_rooms_owner_profile_id_fkey foreign key (owner_profile_id)
    references public.igr_social_profiles(id) on delete cascade;
