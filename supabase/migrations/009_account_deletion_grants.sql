-- =============================================================================
-- Homelio – Grants for self-service account deletion
-- Migration: 009_account_deletion_grants.sql
-- Created: 2026-07-17
-- =============================================================================
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- Do NOT run via supabase CLI migration commands unless separately instructed.
-- =============================================================================
--
-- CONTEXT
-- In this project service_role has no blanket table privileges — it is granted
-- narrowly per table (see 005/007). The account-deletion route (POST
-- /api/account/delete) runs as service_role and must, before deleting the auth
-- user, remove the caller's matches and match_events (these reference
-- profiles/apartments WITHOUT ON DELETE CASCADE and would otherwise block the
-- auth.users deletion cascade). It also reads apartment_photos to clear the
-- storage files.
--
-- Everything else (profiles, apartments, apartment_photos rows,
-- search_preferences, user_application_profiles, notification_*) is removed by
-- the ON DELETE CASCADE chain from auth.users and needs no grant here —
-- referential cascades bypass table privilege checks.
--
-- service_role has the BYPASSRLS attribute, so these GRANTs (not RLS policies)
-- are what the deletion route needs.
-- =============================================================================

GRANT SELECT, DELETE ON public.matches       TO service_role;
GRANT SELECT, DELETE ON public.match_events  TO service_role;
GRANT SELECT          ON public.apartment_photos TO service_role;
