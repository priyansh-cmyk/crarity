INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('pitch-recordings',   'pitch-recordings',   false, 52428800,  NULL),
  ('candidate-resumes',  'candidate-resumes',  false, 10485760,  NULL),
  ('candidate-videos',   'candidate-videos',   false, 104857600, NULL),
  ('audio-recordings',   'audio-recordings',   false, 52428800,  NULL),
  ('email-assets',       'email-assets',       true,  5242880,   NULL)
ON CONFLICT (id) DO NOTHING;
