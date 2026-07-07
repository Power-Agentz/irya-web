begin;

-- Portal Irya additive merge
-- Safe rules:
-- 1. Never rename existing tables/columns.
-- 2. Never remove existing tables/columns.
-- 3. Never change existing primary keys.
-- 4. Only extend existing tables and create new portal history tables.

alter table if exists public.irya_users
  add column if not exists senha_hash text,
  add column if not exists api_key text,
  add column if not exists nome_completo text,
  add column if not exists data_cadastro timestamp with time zone default now();

alter table if exists public.irya_assinaturas
  add column if not exists asaas_subscription_id text,
  add column if not exists asaas_customer_id text,
  add column if not exists api_origem text default 'portal_irya',
  add column if not exists atualizado_em timestamp with time zone default now();

create unique index if not exists irya_perfis_api_key_key
  on public.irya_users (api_key)
  where api_key is not null;

create table if not exists public.irya_pilares (
  id uuid primary key default extensions.uuid_generate_v4(),
  nome_pilar text not null,
  descricao text,
  pontuacao_maxima integer not null,
  criado_em timestamp with time zone not null default now(),
  constraint irya_pilares_nome_pilar_key unique (nome_pilar)
);

create table if not exists public.irya_perguntas (
  id uuid primary key default extensions.uuid_generate_v4(),
  pilar_id uuid not null,
  texto_pergunta text not null,
  ordem integer not null,
  eh_invertida boolean not null default false,
  criado_em timestamp with time zone not null default now(),
  constraint irya_perguntas_pilar_id_fkey
    foreign key (pilar_id)
    references public.irya_pilares(id)
    on delete restrict
);

create table if not exists public.irya_questionarios_concluidos (
  id uuid primary key default extensions.uuid_generate_v4(),
  whatsapp text not null,
  pontuacao_total integer not null,
  percentual_global double precision not null,
  classificacao text not null,
  data_conclusao timestamp with time zone not null default now(),
  origem text not null default 'portal_irya',
  criado_em timestamp with time zone not null default now(),
  constraint irya_questionarios_concluidos_whatsapp_fkey
    foreign key (whatsapp)
    references public.irya_users(whatsapp)
    on delete cascade
);

create table if not exists public.irya_pontuacoes_por_pilar (
  id uuid primary key default extensions.uuid_generate_v4(),
  questionario_concluido_id uuid not null,
  pilar_id uuid not null,
  pontuacao_obtida integer not null,
  criado_em timestamp with time zone not null default now(),
  constraint irya_pontuacoes_por_pilar_questionario_concluido_id_fkey
    foreign key (questionario_concluido_id)
    references public.irya_questionarios_concluidos(id)
    on delete cascade,
  constraint irya_pontuacoes_por_pilar_pilar_id_fkey
    foreign key (pilar_id)
    references public.irya_pilares(id)
    on delete restrict
);

create table if not exists public.irya_answers (
  id uuid primary key default extensions.uuid_generate_v4(),
  whatsapp text not null,
  questionario_concluido_id uuid,
  question_text text not null,
  answer_value integer not null,
  pilar_category text not null,
  created_at timestamp with time zone not null default now(),
  constraint irya_answers_whatsapp_fkey
    foreign key (whatsapp)
    references public.irya_users(whatsapp)
    on delete cascade,
  constraint irya_answers_questionario_concluido_id_fkey
    foreign key (questionario_concluido_id)
    references public.irya_questionarios_concluidos(id)
    on delete cascade
);

create table if not exists public.irya_historico_pesos (
  id uuid primary key default extensions.uuid_generate_v4(),
  whatsapp text not null,
  peso_kg double precision not null,
  altura_m double precision,
  imc double precision,
  data_registro timestamp with time zone not null default now(),
  origem text not null default 'portal_irya',
  criado_em timestamp with time zone not null default now(),
  constraint irya_historico_pesos_whatsapp_fkey
    foreign key (whatsapp)
    references public.irya_users(whatsapp)
    on delete cascade
);

create index if not exists idx_irya_perguntas_pilar_ordem
  on public.irya_perguntas (pilar_id, ordem);

create index if not exists idx_irya_questionarios_concluidos_whatsapp_data
  on public.irya_questionarios_concluidos (whatsapp, data_conclusao desc);

create index if not exists idx_irya_pontuacoes_por_pilar_questionario
  on public.irya_pontuacoes_por_pilar (questionario_concluido_id);

create index if not exists idx_irya_pontuacoes_por_pilar_pilar
  on public.irya_pontuacoes_por_pilar (pilar_id);

create index if not exists idx_irya_answers_whatsapp_created_at
  on public.irya_answers (whatsapp, created_at desc);

create index if not exists idx_irya_answers_pilar_category
  on public.irya_answers (pilar_category);

create index if not exists idx_irya_answers_questionario
  on public.irya_answers (questionario_concluido_id);

create index if not exists idx_irya_historico_pesos_whatsapp_data
  on public.irya_historico_pesos (whatsapp, data_registro desc);

comment on column public.irya_users.senha_hash is
  'Portal Irya authentication hash. Additive field; does not replace existing Supabase profile semantics.';

comment on column public.irya_users.api_key is
  'Portal Irya API key for bot and service integrations.';

comment on column public.irya_users.nome_completo is
  'Portal Irya full name field, kept separate from existing nome/apelido fields.';

comment on table public.irya_pilares is
  'Portal Irya questionnaire pillar catalog.';

comment on table public.irya_perguntas is
  'Portal Irya questionnaire question catalog.';

comment on table public.irya_questionarios_concluidos is
  'Normalized monthly questionnaire history imported from Portal Irya.';

comment on table public.irya_pontuacoes_por_pilar is
  'Per-pillar score history for each Portal Irya questionnaire completion.';

comment on table public.irya_answers is
  'Detailed answer history for Portal Irya questionnaire completions.';

comment on table public.irya_historico_pesos is
  'Historical weight records from Portal Irya, separate from current clinical snapshot.';

commit;
