-- =============================================================================
-- Homelio MVP – Initial Database Schema
-- Migration: 001_initial_schema.sql
-- Created: 2026-06-11
-- =============================================================================
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- Do NOT run via supabase CLI migration commands unless separately instructed.
-- =============================================================================
--
-- PRIVACY MODEL
-- =============================================================================
-- Fields SAFE to show matched users (via future safe_match_display RPC/view):
--   city, zip, district, location_label, approximate_location_text,
--   nearest_stop, transport_minutes_center, rooms, area_sqm, rent_gross,
--   estimated_rent_*, all amenity booleans, noise_level, orientation,
--   school_proximity, lake_proximity, highlights, move_out_flexibility,
--   earliest_move_out, management_company
--
-- Fields PRIVATE to owner only — never expose to other users:
--   street, house_nr, apt_nr     — exact address
--   move_out_reason              — confidential, owner-only forever
--   Personal contact data stays in auth.users (not in these tables).
--
-- Direct SELECT on apartments is owner-only for MVP.
-- A safe_match_display RPC/view will be added in a later phase to expose
-- only the approved display fields to matched users.
-- =============================================================================


-- ── 1. Enums ──────────────────────────────────────────────────────────────────

CREATE TYPE premium_status_enum AS ENUM (
  'free',       -- no active subscription
  'active',     -- subscription is live
  'expired',    -- subscription lapsed
  'cancelled'   -- user cancelled
);

CREATE TYPE apartment_status_enum AS ENUM (
  'draft',    -- onboarding started, not yet visible to matching
  'active',   -- listing visible to matching system
  'paused',   -- user temporarily paused
  'removed'   -- user removed listing
);

CREATE TYPE match_decision_enum AS ENUM (
  'pending',    -- no action taken yet
  'interested', -- "Interesse bestätigen" clicked
  'declined'    -- "Kein Interesse" clicked
);


-- ── 2. Shared updated_at trigger function ─────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ── 3. profiles ───────────────────────────────────────────────────────────────
-- One row per registered user. Auto-created on signup via trigger.

CREATE TABLE profiles (
  id                      uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_premium              boolean     NOT NULL DEFAULT false,
  premium_status          premium_status_enum NOT NULL DEFAULT 'free',
  premium_until           timestamptz NULL,
  onboarding_completed_at timestamptz NULL,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: owner select"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: owner update"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Direct INSERT/DELETE not permitted for users.
-- Signup trigger (below) handles INSERT via service-level function.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ── 4. apartments ─────────────────────────────────────────────────────────────
-- One listing per user for MVP (enforced by unique index on user_id).
-- All fields nullable so onboarding can create a draft with minimal data.

CREATE TABLE apartments (
  id      uuid                  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid                  NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status  apartment_status_enum NOT NULL DEFAULT 'draft',

  -- ── PRIVATE: exact address ────────────────────────────────────────────────
  -- Never send these to another user.
  -- Only accessible after mutual match AND only via server-side session-checked code.
  street   text NULL,
  house_nr text NULL,
  apt_nr   text NULL,

  -- ── SAFE IN MATCH CONTEXT: location display fields ────────────────────────
  -- These are safe to include in match cards.
  -- A future safe_match_display RPC/view will select only these (not street/house_nr/apt_nr).
  city                      text NULL,
  zip                       text NULL,
  district                  text NULL,   -- e.g. "Wiedikon", "Oerlikon"
  location_label            text NULL,   -- e.g. "Nähe Schmiede Wiedikon"
  approximate_location_text text NULL,   -- e.g. "Ruhige Innenlage, wenige Minuten zu Tram 2/3"

  -- ── Core apartment data ───────────────────────────────────────────────────
  management_company   text         NULL,
  floor                integer      NULL,
  rooms                numeric(3,1) NULL,
  area_sqm             integer      NULL,
  rent_gross           integer      NULL,  -- CHF Bruttomiete
  rent_net             integer      NULL,  -- CHF Nettomiete
  additional_costs     integer      NULL,  -- CHF Nebenkosten

  -- Homelio-estimated fair market rent (nullable; filled by a future computation step)
  estimated_rent_net         integer NULL,
  estimated_additional_costs integer NULL,
  estimated_rent_gross       integer NULL,

  has_elevator         text NULL,   -- 'yes' | 'no' | 'unknown'
  earliest_move_out    date NULL,
  move_out_flexibility text NULL,   -- 'immediate' | '1-3' | '3-6' | '6+' | 'flexible'

  -- ── Amenities ─────────────────────────────────────────────────────────────
  has_balcony              boolean NOT NULL DEFAULT false,
  has_terrace              boolean NOT NULL DEFAULT false,
  has_garden               boolean NOT NULL DEFAULT false,
  has_cellar               boolean NOT NULL DEFAULT false,
  is_wheelchair_accessible boolean NOT NULL DEFAULT false,
  parking_type             text NULL,  -- 'none' | 'outdoor' | 'indoor' | 'carport'
  laundry                  text NULL,  -- 'private' | 'shared' | 'none'
  pets_allowed             text NULL,  -- 'yes' | 'no' | 'unknown'
  is_furnished             text NULL,  -- 'no' | 'partial' | 'yes'
  heating_type             text NULL,  -- 'central' | 'district' | 'heat_pump' | 'gas' | 'oil' | 'electric' | 'wood' | 'unknown'
  build_year               integer NULL,
  renovation_year          integer NULL,

  -- ── Location environment ──────────────────────────────────────────────────
  noise_level              text    NULL,  -- 'quiet' | 'moderate' | 'urban'
  orientation              text    NULL,  -- 'south' | 'north' | 'east' | 'west' | 'mixed'
  nearest_stop             text    NULL,  -- e.g. "Tram 2/3 Schmiede Wiedikon (4 min)"
  transport_minutes_center integer NULL,
  school_proximity         text    NULL,  -- 'good' | 'ok' | 'not_relevant'
  lake_proximity           text    NULL,  -- 'good' | 'ok' | 'not_relevant'

  -- ── Notes ─────────────────────────────────────────────────────────────────
  highlights text NULL,  -- Besonderheiten — safe to share with matched users

  -- CONFIDENTIAL: never expose to another user under any circumstances.
  move_out_reason text NULL,

  -- ── Consent ───────────────────────────────────────────────────────────────
  confidentiality      text    NOT NULL DEFAULT 'verified_matches',  -- 'verified_matches' | 'management' | 'anonymous'
  allow_sharing        boolean NOT NULL DEFAULT false,
  is_authorized_tenant boolean NOT NULL DEFAULT false,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One apartment per user for MVP
CREATE UNIQUE INDEX apartments_user_id_unique ON apartments (user_id);

CREATE INDEX apartments_city_idx   ON apartments (city);
CREATE INDEX apartments_status_idx ON apartments (status);

CREATE TRIGGER apartments_updated_at
  BEFORE UPDATE ON apartments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;

-- Direct SELECT is owner-only for MVP.
-- Matched users will access apartment data via a safe_match_display RPC (future phase)
-- that exposes only approved display fields and excludes street, house_nr, apt_nr, move_out_reason.
CREATE POLICY "apartments: owner select"
  ON apartments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "apartments: owner insert"
  ON apartments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "apartments: owner update"
  ON apartments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "apartments: owner delete"
  ON apartments FOR DELETE
  USING (auth.uid() = user_id);


-- ── 5. apartment_photos ───────────────────────────────────────────────────────
-- References to images in the 'apartment-photos' Supabase Storage bucket.
-- Bucket and storage policies are configured in Phase 2F.
-- Photo access for matched users is controlled via server-generated signed URLs.

CREATE TABLE apartment_photos (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid        NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  -- Path in 'apartment-photos' bucket: {user_id}/{apartment_id}/{uuid}.jpg
  storage_path text        NOT NULL,
  position     integer     NOT NULL DEFAULT 0,
  uploaded_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX apartment_photos_apartment_id_idx ON apartment_photos (apartment_id);

ALTER TABLE apartment_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "apartment_photos: owner select"
  ON apartment_photos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "apartment_photos: owner insert"
  ON apartment_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "apartment_photos: owner update"
  ON apartment_photos FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "apartment_photos: owner delete"
  ON apartment_photos FOR DELETE
  USING (auth.uid() = user_id);


-- ── 6. search_preferences ────────────────────────────────────────────────────
-- What the user is looking for. Strictly private — no other user reads this.
-- One row per user (UNIQUE on user_id) for MVP.
-- Premium filters are stored for all users but the matching system applies them
-- only when profiles.is_premium = true.

CREATE TABLE search_preferences (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,

  -- ── Free tier (all users) ─────────────────────────────────────────────────
  city_region    text    NULL,  -- e.g. "Zürich, Winterthur" — comma-separated
  max_rent_gross integer NULL,  -- CHF Bruttomiete maximum

  -- ── Premium filters (applied only when profiles.is_premium = true) ────────
  rooms_min                numeric(3,1) NULL,
  rooms_max                numeric(3,1) NULL,
  area_min_sqm             integer      NULL,
  desired_move_in          date         NULL,
  household_size           text         NULL,    -- '1' | '2' | '3' | '4' | '5+'
  search_radius_km         integer      NULL,    -- NULL = unlimited
  has_pets                 boolean      NOT NULL DEFAULT false,
  requires_balcony         boolean      NOT NULL DEFAULT false,
  requires_elevator        boolean      NOT NULL DEFAULT false,
  transport_importance     text         NULL,    -- 'low' | 'medium' | 'high'
  preferred_neighborhoods  text         NULL,
  commute_destination      text         NULL,
  commute_max_minutes      integer      NULL,
  preferred_transit_lines  text         NULL,
  noise_sensitivity        text         NULL,    -- 'low' | 'high'
  sun_orientation          text         NULL,    -- 'south' | 'any'
  min_floor                integer      NULL,
  max_walk_to_stop_minutes integer      NULL,
  building_age             text         NULL,    -- 'new' | 'mid' | 'old' | 'any'
  renovated_kitchen        boolean      NOT NULL DEFAULT false,
  renovated_bathroom       boolean      NOT NULL DEFAULT false,
  requires_private_washer  boolean      NOT NULL DEFAULT false,
  requires_parking         boolean      NOT NULL DEFAULT false,
  preferred_managements    text         NULL,
  blocked_managements      text         NULL,

  -- ── Notification preferences ──────────────────────────────────────────────
  notify_frequency       text    NOT NULL DEFAULT 'daily',  -- 'immediately' | 'daily' | 'weekly'
  notify_recommendations boolean NOT NULL DEFAULT true,
  notify_gegenseite      boolean NOT NULL DEFAULT true,
  notify_mutual          boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER search_preferences_updated_at
  BEFORE UPDATE ON search_preferences
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE search_preferences ENABLE ROW LEVEL SECURITY;

-- Strictly private: no other user ever reads search preferences.
CREATE POLICY "search_preferences: owner select"
  ON search_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "search_preferences: owner insert"
  ON search_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "search_preferences: owner update"
  ON search_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "search_preferences: owner delete"
  ON search_preferences FOR DELETE
  USING (auth.uid() = user_id);


-- ── 7. matches ────────────────────────────────────────────────────────────────
-- Homelio-generated pairings between two users' apartments.
-- Users cannot INSERT or UPDATE rows directly.
-- Decisions are recorded exclusively via the express_interest() RPC below.

CREATE TABLE matches (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The two apartments in this pairing
  apartment_a_id uuid NOT NULL REFERENCES apartments(id),
  apartment_b_id uuid NOT NULL REFERENCES apartments(id),

  -- Denormalized user IDs for efficient RLS and query performance
  user_a_id      uuid NOT NULL REFERENCES profiles(id),
  user_b_id      uuid NOT NULL REFERENCES profiles(id),

  -- Match quality scores (0–100)
  score_a_sees_b integer NULL,  -- how well apartment_b matches user_a's search prefs
  score_b_sees_a integer NULL,  -- how well apartment_a matches user_b's search prefs

  -- Per-user decisions (updated only via express_interest RPC)
  status_a       match_decision_enum NOT NULL DEFAULT 'pending',  -- user_a's decision on apartment_b
  status_b       match_decision_enum NOT NULL DEFAULT 'pending',  -- user_b's decision on apartment_a

  -- True when both sides are 'interested'. Maintained by update_match_mutual trigger.
  is_mutual      boolean NOT NULL DEFAULT false,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Canonical pair ordering prevents duplicate rows for the same two apartments in reverse order.
  -- The matching script must always insert with apartment_a_id < apartment_b_id (UUID byte order).
  CONSTRAINT matches_canonical_order CHECK (apartment_a_id < apartment_b_id),
  CONSTRAINT matches_pair_unique     UNIQUE (apartment_a_id, apartment_b_id)
);

CREATE INDEX matches_user_a_idx         ON matches (user_a_id);
CREATE INDEX matches_user_b_idx         ON matches (user_b_id);
CREATE INDEX matches_user_a_status_idx  ON matches (user_a_id, status_a);
CREATE INDEX matches_user_b_status_idx  ON matches (user_b_id, status_b);
CREATE INDEX matches_is_mutual_idx      ON matches (is_mutual);

-- Recompute is_mutual whenever status_a or status_b changes.
CREATE OR REPLACE FUNCTION update_match_mutual()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.is_mutual := (NEW.status_a = 'interested' AND NEW.status_b = 'interested');
  RETURN NEW;
END;
$$;

-- Fires alphabetically before matches_updated_at, so is_mutual is set first.
CREATE TRIGGER matches_sync_mutual
  BEFORE UPDATE ON matches
  FOR EACH ROW
  WHEN (
    OLD.status_a IS DISTINCT FROM NEW.status_a
    OR OLD.status_b IS DISTINCT FROM NEW.status_b
  )
  EXECUTE FUNCTION update_match_mutual();

CREATE TRIGGER matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Only the two participants may read a match row.
CREATE POLICY "matches: participant select"
  ON matches FOR SELECT
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- No direct INSERT by users (service role only, via future matching script).
-- No direct UPDATE by users (via express_interest RPC only).
-- No direct DELETE.


-- ── 8. match_events ───────────────────────────────────────────────────────────
-- Immutable audit log of every interest/decline action.
-- Written exclusively by the express_interest() RPC.

CREATE TABLE match_events (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id      uuid        NOT NULL REFERENCES matches(id),
  actor_user_id uuid        NOT NULL REFERENCES profiles(id),
  event_type    text        NOT NULL,  -- 'interested' | 'declined'
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX match_events_match_id_idx       ON match_events (match_id);
CREATE INDEX match_events_actor_user_id_idx  ON match_events (actor_user_id);

ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;

-- Participants can read all events for matches they are part of.
CREATE POLICY "match_events: participant select"
  ON match_events FOR SELECT
  USING (
    auth.uid() = actor_user_id
    OR EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = match_events.match_id
        AND (matches.user_a_id = auth.uid() OR matches.user_b_id = auth.uid())
    )
  );

-- No direct INSERT, UPDATE, or DELETE.


-- ── 9. express_interest RPC ───────────────────────────────────────────────────
-- Called by authenticated users to accept or decline a match suggestion.
-- SECURITY DEFINER is required because users have no direct UPDATE on matches
-- and no direct INSERT on match_events.
-- Validates caller identity before touching any row.

CREATE OR REPLACE FUNCTION express_interest(
  p_match_id uuid,
  p_decision text  -- 'interested' or 'declined'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match     matches%ROWTYPE;
  v_caller_id uuid := auth.uid();
BEGIN
  -- Validate input
  IF p_decision NOT IN ('interested', 'declined') THEN
    RAISE EXCEPTION 'Invalid decision: must be ''interested'' or ''declined''';
  END IF;
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Load match row
  SELECT * INTO v_match FROM matches WHERE id = p_match_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  -- Verify the caller is actually a participant in this match
  IF v_caller_id != v_match.user_a_id AND v_caller_id != v_match.user_b_id THEN
    RAISE EXCEPTION 'Not a participant in this match';
  END IF;

  -- Update only the caller's status column.
  -- The matches_sync_mutual trigger recomputes is_mutual automatically.
  IF v_caller_id = v_match.user_a_id THEN
    UPDATE matches
       SET status_a = p_decision::match_decision_enum
     WHERE id = p_match_id;
  ELSE
    UPDATE matches
       SET status_b = p_decision::match_decision_enum
     WHERE id = p_match_id;
  END IF;

  -- Append immutable audit event
  INSERT INTO match_events (match_id, actor_user_id, event_type)
  VALUES (p_match_id, v_caller_id, p_decision);
END;
$$;
