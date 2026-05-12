-- Fix: the guard trigger was unconditionally overwriting updated_by with auth.uid()
-- on every UPDATE. This meant that when an admin approves / scores a candidate,
-- updated_by becomes the admin's UUID and the candidate's dashboard query
-- (.eq("updated_by", user.id)) can no longer find their session.
--
-- Fix: only write updated_by when it is currently NULL (first-time candidate link).
-- Once a candidate's user_id is stored, never overwrite it.

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
    -- Identity + structural fields are permanently locked:
    NEW.completed  := OLD.completed;
    NEW.role_id    := OLD.role_id;
    NEW.email      := OLD.email;
    NEW.phone      := OLD.phone;
    NEW.name       := OLD.name;
    NEW.city       := OLD.city;
    NEW.role_type  := OLD.role_type;
    NEW.created_at := OLD.created_at;

  ELSE
    -- In-progress session: prevent identity tampering by anyone
    NEW.role_id    := COALESCE(OLD.role_id, NEW.role_id);  -- set-once
    NEW.role_type  := OLD.role_type;
    NEW.created_at := OLD.created_at;
  END IF;

  NEW.updated_at  := now();

  -- CRITICAL: only set updated_by when it is currently NULL.
  -- This preserves the candidate's user link once link_session_to_user has run.
  -- Without this, any admin action overwrites updated_by with the admin's UUID,
  -- breaking the candidate's dashboard lookup.
  NEW.updated_by  := COALESCE(OLD.updated_by, auth.uid());

  RETURN NEW;
END;
$$;
