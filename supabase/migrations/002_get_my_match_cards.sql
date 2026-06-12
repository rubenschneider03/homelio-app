-- =============================================================================
-- Homelio MVP – Match Card Display RPC
-- Migration: 002_get_my_match_cards.sql
-- =============================================================================
-- Purpose:
--   Expose safe apartment display fields to authenticated users for matches
--   in which they are a participant.
--
-- Privacy guarantees:
--   This function never returns: street, house_nr, apt_nr, management_company,
--   move_out_reason, or any identity / contact data.
--   Private fields are excluded architecturally from the RETURNS TABLE
--   declaration — they are impossible to leak even if the function body changes.
--
-- Security model:
--   SECURITY DEFINER so the function can JOIN apartments without the caller
--   holding a SELECT policy on another user's row.
--   The WHERE clause enforces participant membership before any data is returned.
--   Unauthenticated callers (auth.uid() = NULL) receive zero rows.
-- =============================================================================

CREATE OR REPLACE FUNCTION get_my_match_cards()
RETURNS TABLE (
  -- Match metadata
  match_id              uuid,
  my_side               text,               -- 'a' | 'b'
  my_status             match_decision_enum,
  other_status          match_decision_enum,
  is_mutual             boolean,
  score                 integer,

  -- Safe apartment display fields (private fields omitted from RETURNS TABLE)
  rooms                         numeric,
  area_sqm                      integer,
  floor                         integer,
  rent_gross                    integer,
  rent_net                      integer,
  additional_costs              integer,
  estimated_rent_net            integer,
  estimated_additional_costs    integer,
  estimated_rent_gross          integer,
  city                          text,
  zip                           text,
  district                      text,
  location_label                text,
  approximate_location_text     text,
  nearest_stop                  text,
  transport_minutes_center      integer,
  earliest_move_out             date,
  move_out_flexibility          text,
  has_balcony                   boolean,
  has_terrace                   boolean,
  has_garden                    boolean,
  has_cellar                    boolean,
  is_wheelchair_accessible      boolean,
  has_elevator                  text,
  parking_type                  text,
  laundry                       text,
  noise_level                   text,
  orientation                   text,
  highlights                    text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  -- Unauthenticated callers get zero rows, not an error.
  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    -- Match metadata
    m.id                                                                      AS match_id,
    CASE WHEN m.user_a_id = v_uid THEN 'a' ELSE 'b' END                      AS my_side,
    CASE WHEN m.user_a_id = v_uid THEN m.status_a ELSE m.status_b END        AS my_status,
    CASE WHEN m.user_a_id = v_uid THEN m.status_b ELSE m.status_a END        AS other_status,
    m.is_mutual,
    CASE WHEN m.user_a_id = v_uid THEN m.score_a_sees_b ELSE m.score_b_sees_a END AS score,

    -- Safe apartment display fields from the OTHER user's apartment only
    a.rooms,
    a.area_sqm,
    a.floor,
    a.rent_gross,
    a.rent_net,
    a.additional_costs,
    a.estimated_rent_net,
    a.estimated_additional_costs,
    a.estimated_rent_gross,
    a.city,
    a.zip,
    a.district,
    a.location_label,
    a.approximate_location_text,
    a.nearest_stop,
    a.transport_minutes_center,
    a.earliest_move_out,
    a.move_out_flexibility,
    a.has_balcony,
    a.has_terrace,
    a.has_garden,
    a.has_cellar,
    a.is_wheelchair_accessible,
    a.has_elevator,
    a.parking_type,
    a.laundry,
    a.noise_level,
    a.orientation,
    a.highlights

  FROM matches m
  -- Join the OTHER apartment (not the caller's own)
  JOIN apartments a
    ON a.id = CASE
                WHEN m.user_a_id = v_uid THEN m.apartment_b_id
                ELSE m.apartment_a_id
              END

  WHERE
    -- Caller must be a participant
    (m.user_a_id = v_uid OR m.user_b_id = v_uid)
    -- Hide matches the caller has already declined
    AND (
      CASE WHEN m.user_a_id = v_uid THEN m.status_a ELSE m.status_b END
    ) != 'declined';

END;
$$;

-- Grant execute to authenticated users only.
-- anon role has no access to this function.
GRANT EXECUTE ON FUNCTION get_my_match_cards() TO authenticated;
