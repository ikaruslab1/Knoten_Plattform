-- =============================================================
-- KNOTEN - Allowed UNAM Account Numbers
-- =============================================================

CREATE TABLE IF NOT EXISTS public.allowed_account_numbers (
  numero_cuenta TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.allowed_account_numbers ENABLE ROW LEVEL SECURITY;

-- Read policy: accessible for select queries
CREATE POLICY "allowed_accounts_select_all" ON public.allowed_account_numbers
  FOR SELECT USING (true);

-- Insert authorized UNAM account numbers
INSERT INTO public.allowed_account_numbers (numero_cuenta) VALUES
  ('322300691'),
  ('322085376'),
  ('425070837'),
  ('321150228'),
  ('322069495'),
  ('322158708'),
  ('322050224'),
  ('322006087'),
  ('322050633'),
  ('322256718'),
  ('322044418'),
  ('322039173'),
  ('322020050'),
  ('322065332'),
  ('322129335'),
  ('322293441'),
  ('322273940'),
  ('322075287'),
  ('322069282'),
  ('322066951'),
  ('323047742'),
  ('323031888'),
  ('323157278'),
  ('323217864'),
  ('323019833'),
  ('323224835'),
  ('323159148'),
  ('323263270'),
  ('323272582'),
  ('323240826'),
  ('323119885'),
  ('323183781'),
  ('323195726'),
  ('323215657'),
  ('323045865'),
  ('323250977'),
  ('323278838'),
  ('323301222')
ON CONFLICT (numero_cuenta) DO NOTHING;
