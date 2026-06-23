-- =============================================================================
-- Homelio – Stripe Premium Payment Support
-- Migration: 005_premium_payments.sql
-- =============================================================================
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- Do NOT run via supabase CLI migration commands unless separately instructed.
-- =============================================================================
--
-- Changes:
--   1. premium_status_enum: add 'pending' and 'failed' values
--   2. profiles: add stripe_customer_id, stripe_checkout_session_id,
--                    premium_purchased_at
--   3. Grant service_role UPDATE on payment-relevant profile columns
--      (needed for webhook handler to activate premium without user session)
--
-- RLS is NOT relaxed for regular users.
-- Premium activation only happens via service_role (webhook route).
-- =============================================================================


-- ── 1. Extend enum with new payment states ────────────────────────────────────

ALTER TYPE premium_status_enum ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE premium_status_enum ADD VALUE IF NOT EXISTS 'failed';


-- ── 2. Add Stripe columns to profiles ────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id        text        NULL,
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text       NULL,
  ADD COLUMN IF NOT EXISTS premium_purchased_at      timestamptz NULL;


-- ── 3. Grant service_role SELECT + UPDATE on profiles ────────────────────────
-- The webhook route uses the service role key to activate premium.
-- Without this grant, the service client's UPDATE is rejected.

GRANT SELECT ON public.profiles TO service_role;
GRANT UPDATE (
  is_premium,
  premium_status,
  premium_until,
  premium_purchased_at,
  stripe_customer_id,
  stripe_checkout_session_id
) ON public.profiles TO service_role;
