
CREATE TABLE public.app_settings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  github_pdf_url TEXT NOT NULL DEFAULT '',
  admin_password TEXT NOT NULL DEFAULT '000',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.app_settings (github_pdf_url, admin_password)
VALUES ('', '000');

CREATE TABLE public.exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.exams TO service_role;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
