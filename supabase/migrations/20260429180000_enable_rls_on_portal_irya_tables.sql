begin;

alter table if exists public.irya_pilares enable row level security;
alter table if exists public.irya_perguntas enable row level security;
alter table if exists public.irya_questionarios_concluidos enable row level security;
alter table if exists public.irya_pontuacoes_por_pilar enable row level security;
alter table if exists public.irya_answers enable row level security;
alter table if exists public.irya_historico_pesos enable row level security;

commit;
