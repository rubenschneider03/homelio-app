-- =============================================================================
-- Homelio – Stripe Subscription ID Column
-- Migration: 006_add_stripe_subscription_id.sql
-- =============================================================================
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- Do NOT run via supabase CLI migration commands unless separately instructed.
-- =============================================================================
--
-- Changes:
--   1. profiles: add stripe_subscription_id
--      Needed because Premium checkout now uses Stripe subscription mode
--      (see 005_premium_payments.sql for the one-time-payment columns).
--   2. Grant service_role UPDATE on the new column
--      (needed for webhook handler to store the subscription id)
--
-- RLS is NOT relaxed for regular users.
-- No destructive operations.
-- =============================================================================


-- ── 1. Add Stripe subscription column to profiles ─────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;


-- ── 2. Grant service_role UPDATE on the new column ────────────────────────────
-- The webhook route uses the service role key to store the subscription id.
-- Without this grant, the service client's UPDATE is rejected.

GRANT UPDATE (stripe_subscription_id) ON public.profiles TO service_role;
