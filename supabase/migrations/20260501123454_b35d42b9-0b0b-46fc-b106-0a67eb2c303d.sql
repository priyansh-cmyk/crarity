
CREATE OR REPLACE FUNCTION public.link_session_to_user(_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _user_email text;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email INTO _user_email FROM auth.users WHERE id = _user_id;

  UPDATE public.assessment_sessions
  SET updated_by = _user_id
  WHERE id = _session_id
    AND updated_by IS NULL
    AND email = _user_email;
END;
$$;

REVOKE ALL ON FUNCTION public.link_session_to_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.link_session_to_user(uuid) TO authenticated;
