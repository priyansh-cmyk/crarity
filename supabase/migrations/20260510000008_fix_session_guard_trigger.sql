-- The original assessment_sessions_guard trigger blocked ALL score updates on completed
-- sessions — including admin score reviews — by restoring OLD.scores and OLD.total_score.
-- Fix: authenticated users (admin / employer) may update scores, total_score, status,
-- and admin_approved on completed sessions. Only anon users are fully locked out.

CREATE OR REPLACE FUNCTION public.assessment_sessions_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.completed = true THEN
    -- Anon (candidates) cannot touch completed sessions at all
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Cannot modify a completed assessment session';
    END IF;

    -- Authenticated users (admin / employer) may update operational fields:
    --   scores, total_score, status, admin_approved, pipeline_status, updated_at
    -- But identity + structural fields are permanently locked:
    NEW.completed  := OLD.completed;
    NEW.role_id    := OLD.role_id;
    NEW.email      := OLD.email;
    NEW.phone      := OLD.phone;
    NEW.name       := OLD.name;
    NEW.city       := OLD.city;
    NEW.role_type  := OLD.role_type;
    NEW.created_at := OLD.created_at;
    -- scores / total_score / status / admin_approved are intentionally NOT locked here
    -- so admins can review, override scores, approve, or update pipeline status.

  ELSE
    -- In-progress session: prevent identity tampering by anyone
    NEW.role_id    := COALESCE(OLD.role_id, NEW.role_id);  -- set-once
    NEW.role_type  := OLD.role_type;
    NEW.created_at := OLD.created_at;
  END IF;

  NEW.updated_at  := now();
  NEW.updated_by  := auth.uid();
  RETURN NEW;
END;
$$;
