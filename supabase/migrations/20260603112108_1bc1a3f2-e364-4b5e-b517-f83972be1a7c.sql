CREATE TABLE public.subjects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  github_pdf_url text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.subjects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT ALL ON public.subjects TO service_role;

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subjects are viewable by everyone"
ON public.subjects FOR SELECT
USING (true);

INSERT INTO public.subjects (slug, name_ar, name_en, sort_order) VALUES
  ('arabic', 'عربي', 'Arabic', 1),
  ('english', 'إنجليزي', 'English', 2),
  ('math', 'رياضيات', 'Mathematics', 3),
  ('science', 'علوم', 'Science', 4),
  ('islamic', 'تربية إسلامية', 'Islamic Studies', 5),
  ('social', 'اجتماعيات', 'Social Studies', 6);