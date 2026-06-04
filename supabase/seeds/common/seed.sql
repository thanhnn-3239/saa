-- Reference data seed (no auth dependency). User/kudo rows are created at runtime via OAuth.

insert into public.departments (name) values
  ('Engineering'), ('Design'), ('Product'), ('Operations'), ('HR')
on conflict (name) do nothing;

insert into public.hashtags (name) values
  ('teamwork'), ('innovation'), ('ownership'), ('mentorship'),
  ('above-and-beyond'), ('customer-first'), ('positivity'), ('reliability')
on conflict (name) do nothing;

insert into public.badges (name, weight, description) values
  ('Stay Gold',        30, 'Common badge'),
  ('Flow to Horizon',  25, 'Common badge'),
  ('Touch of Light',   20, 'Uncommon badge'),
  ('Beyond Boundary',  10, 'Rare badge'),
  ('Revival',          10, 'Rare badge'),
  ('Root Further',      5, 'Legendary badge')
on conflict (name) do nothing;

insert into public.awards (category, name, description, sort_order) values
  ('Individual', 'Most Valuable Player', 'Top recognized individual', 1),
  ('Individual', 'Rising Star',          'Outstanding newcomer',      2),
  ('Team',       'Best Team',            'Most recognized team',      3),
  ('Team',       'Collaboration Award',  'Best cross-team work',      4),
  ('Special',    'Culture Champion',     'Embodies company values',   5),
  ('Special',    'Innovation Award',     'Most innovative impact',    6);
