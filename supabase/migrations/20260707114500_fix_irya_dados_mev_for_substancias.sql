begin;

alter table if exists public.irya_dados_mev
  add column if not exists score_substancias_nocivas integer;

alter table if exists public.irya_dados_mev
  drop constraint if exists irya_dados_mev_score_nutricao_check;

alter table if exists public.irya_dados_mev
  drop constraint if exists irya_dados_mev_score_substancias_nocivas_check;

alter table if exists public.irya_dados_mev
  add constraint irya_dados_mev_score_nutricao_check
  check (((score_nutricao >= 0) and (score_nutricao <= 15)));

alter table if exists public.irya_dados_mev
  add constraint irya_dados_mev_score_substancias_nocivas_check
  check (((score_substancias_nocivas >= 0) and (score_substancias_nocivas <= 9)));

comment on table public.irya_dados_mev is
  'Armazena as respostas mensais da avaliacao de estilo de vida. Estrutura ajustada para 6 pilares, incluindo Substancias Nocivas.';

comment on column public.irya_dados_mev.score_nutricao is
  'Score do pilar Nutricao apos a separacao das perguntas de alcool, tabaco e outras substancias.';

comment on column public.irya_dados_mev.score_substancias_nocivas is
  'Score do pilar Substancias Nocivas (alcool, tabaco e outras substancias).';

commit;
