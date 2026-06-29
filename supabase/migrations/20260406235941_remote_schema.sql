


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "develop";


ALTER SCHEMA "develop" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";






CREATE OR REPLACE FUNCTION "public"."clone_schema"("source_schema" "text", "dest_schema" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$ 
DECLARE 
  object text; 
  buffer text; 
BEGIN 
  -- Loop pelas tabelas
  FOR object IN 
    SELECT table_name::text 
    FROM information_schema.tables 
    WHERE table_schema = source_schema 
    AND table_type = 'BASE TABLE'
  LOOP 
    buffer := dest_schema || '."' || object || '"'; 
    
    -- 1. Cria a tabela copiando estrutura (incluindo defaults e índices)
    EXECUTE 'CREATE TABLE ' || buffer || ' (LIKE ' || source_schema || '."' || object || '" INCLUDING ALL)';
    
    -- 2. Copia os dados
    EXECUTE 'INSERT INTO ' || buffer || ' SELECT * FROM ' || source_schema || '."' || object || '"';
    
    -- Nota: As sequences (IDs autoincrement) são copiadas como estrutura, 
    -- mas o "valor atual" pode reiniciar. Ajustes manuais podem ser necessários.
  END LOOP; 
END; 
$$;


ALTER FUNCTION "public"."clone_schema"("source_schema" "text", "dest_schema" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."exec_sql"("sql_query" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;


ALTER FUNCTION "public"."exec_sql"("sql_query" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_schema_columns"("p_schema_name" "text", "p_table_name" "text") RETURNS TABLE("column_name" "text", "data_type" "text", "is_nullable" "text")
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT column_name::TEXT, data_type::TEXT, is_nullable::TEXT
  FROM information_schema.columns 
  WHERE table_schema = p_schema_name 
    AND table_name = p_table_name
  ORDER BY ordinal_position;
$$;


ALTER FUNCTION "public"."get_schema_columns"("p_schema_name" "text", "p_table_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_schema_tables"() RETURNS TABLE("schema_name" "text", "table_name" "text")
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT table_schema::TEXT, table_name::TEXT 
  FROM information_schema.tables 
  WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
    AND table_schema NOT LIKE 'pg_%'
    AND table_schema NOT LIKE '_prisma_%'
    AND table_type = 'BASE TABLE';
$$;


ALTER FUNCTION "public"."get_schema_tables"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."irya_criar_registros_iniciais"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Dados Clinicos (registro vazio, preenchido via onboarding/MEV)
  INSERT INTO irya_dados_clinicos (whatsapp)
  VALUES (NEW.whatsapp)
  ON CONFLICT (whatsapp) DO NOTHING;

  -- Gamificacao (defaults: semente, semana 1, progresso 0)
  INSERT INTO irya_gamificacao (whatsapp)
  VALUES (NEW.whatsapp)
  ON CONFLICT (whatsapp) DO NOTHING;

  -- Onboarding (inicia com fluxo pre_mev)
  INSERT INTO irya_rastreio_onboarding (whatsapp, tipo_fluxo)
  VALUES (NEW.whatsapp, 'pre_mev')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."irya_criar_registros_iniciais"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_irya_faq"("query_embedding" "public"."vector", "match_count" integer DEFAULT NULL::integer, "filter" "jsonb" DEFAULT '{}'::"jsonb") RETURNS TABLE("id" bigint, "content" "text", "metadata" "jsonb", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.content,
    t.metadata,
    1 - (t.embedding <=> query_embedding) AS similarity
  FROM irya_faq t
  WHERE t.metadata @> filter
  ORDER BY t.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


ALTER FUNCTION "public"."match_irya_faq"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_irya_guia_apoio_emocional"("query_embedding" "public"."vector", "match_count" integer DEFAULT NULL::integer, "filter" "jsonb" DEFAULT '{}'::"jsonb") RETURNS TABLE("id" bigint, "content" "text", "metadata" "jsonb", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.content,
    t.metadata,
    1 - (t.embedding <=> query_embedding) AS similarity
  FROM irya_guia_apoio_emocional t
  WHERE t.metadata @> filter
  ORDER BY t.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


ALTER FUNCTION "public"."match_irya_guia_apoio_emocional"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_irya_mev_reference"("query_embedding" "public"."vector", "match_count" integer DEFAULT NULL::integer, "filter" "jsonb" DEFAULT '{}'::"jsonb") RETURNS TABLE("id" bigint, "content" "text", "metadata" "jsonb", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.content,
    t.metadata,
    1 - (t.embedding <=> query_embedding) AS similarity
  FROM irya_mev_reference t
  WHERE t.metadata @> filter
  ORDER BY t.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


ALTER FUNCTION "public"."match_irya_mev_reference"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_whim_consultas"("query_embedding" "public"."vector", "match_count" integer DEFAULT NULL::integer, "filter" "jsonb" DEFAULT '{}'::"jsonb") RETURNS TABLE("id" bigint, "content" "text", "metadata" "jsonb", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
#variable_conflict use_column
begin
  return query
  select
    whim_consultas.id,
    whim_consultas.content,
    whim_consultas.metadata,
    1 - (whim_consultas.embedding <=> query_embedding) as similarity
  from whim_consultas
  where whim_consultas.metadata @> filter
  order by whim_consultas.embedding <=> query_embedding
  limit match_count;
end;
$$;


ALTER FUNCTION "public"."match_whim_consultas"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_whim_faq"("query_embedding" "public"."vector", "match_count" integer DEFAULT NULL::integer, "filter" "jsonb" DEFAULT '{}'::"jsonb") RETURNS TABLE("id" bigint, "content" "text", "metadata" "jsonb", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
#variable_conflict use_column
begin
  return query
  select
    whim_faq.id,
    whim_faq.content,
    whim_faq.metadata,
    1 - (whim_faq.embedding <=> query_embedding) as similarity
  from whim_faq
  where whim_faq.metadata @> filter
  order by whim_faq.embedding <=> query_embedding
  limit match_count;
end;
$$;


ALTER FUNCTION "public"."match_whim_faq"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_whim_objecoes"("query_embedding" "public"."vector", "match_count" integer DEFAULT NULL::integer, "filter" "jsonb" DEFAULT '{}'::"jsonb") RETURNS TABLE("id" bigint, "content" "text", "metadata" "jsonb", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
#variable_conflict use_column
begin
  return query
  select
    whim_objecoes.id,
    whim_objecoes.content,
    whim_objecoes.metadata,
    1 - (whim_objecoes.embedding <=> query_embedding) as similarity
  from whim_objecoes
  where whim_objecoes.metadata @> filter
  order by whim_objecoes.embedding <=> query_embedding
  limit match_count;
end;
$$;


ALTER FUNCTION "public"."match_whim_objecoes"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_whim_perguntas_respostas"("query_embedding" "public"."vector", "match_count" integer DEFAULT NULL::integer, "filter" "jsonb" DEFAULT '{}'::"jsonb") RETURNS TABLE("id" bigint, "content" "text", "metadata" "jsonb", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
#variable_conflict use_column
begin
  return query
  select
    whim_perguntas_respostas.id,
    whim_perguntas_respostas.content,
    whim_perguntas_respostas.metadata,
    1 - (whim_perguntas_respostas.embedding <=> query_embedding) as similarity
  from whim_perguntas_respostas
  where whim_perguntas_respostas.metadata @> filter
  order by whim_perguntas_respostas.embedding <=> query_embedding
  limit match_count;
end;
$$;


ALTER FUNCTION "public"."match_whim_perguntas_respostas"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_whim_servicos"("query_embedding" "public"."vector", "match_count" integer DEFAULT NULL::integer, "filter" "jsonb" DEFAULT '{}'::"jsonb") RETURNS TABLE("id" bigint, "content" "text", "metadata" "jsonb", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
#variable_conflict use_column
begin
  return query
  select
    whim_servicos.id,
    whim_servicos.content,
    whim_servicos.metadata,
    1 - (whim_servicos.embedding <=> query_embedding) as similarity
  from whim_servicos
  where whim_servicos.metadata @> filter
  order by whim_servicos.embedding <=> query_embedding
  limit match_count;
end;
$$;


ALTER FUNCTION "public"."match_whim_servicos"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."flora_memory" (
    "id" integer NOT NULL,
    "session_id" character varying(255) NOT NULL,
    "message" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."flora_memory" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."teste_flora_memory_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."teste_flora_memory_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."teste_flora_memory_id_seq" OWNED BY "public"."flora_memory"."id";



CREATE TABLE IF NOT EXISTS "develop"."flora_memory" (
    "id" integer DEFAULT "nextval"('"public"."teste_flora_memory_id_seq"'::"regclass") NOT NULL,
    "session_id" character varying(255) NOT NULL,
    "message" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "develop"."flora_memory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."whim_consultas" (
    "id" bigint NOT NULL,
    "content" "text",
    "metadata" "jsonb",
    "embedding" "public"."vector"(1536)
);


ALTER TABLE "public"."whim_consultas" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."whim_consultas_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."whim_consultas_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."whim_consultas_id_seq" OWNED BY "public"."whim_consultas"."id";



CREATE TABLE IF NOT EXISTS "develop"."whim_consultas" (
    "id" bigint DEFAULT "nextval"('"public"."whim_consultas_id_seq"'::"regclass") NOT NULL,
    "content" "text",
    "metadata" "jsonb",
    "embedding" "public"."vector"(1536)
);


ALTER TABLE "develop"."whim_consultas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "develop"."whim_crm" (
    "remoteJid" "text" NOT NULL,
    "Data_oportunidade" timestamp with time zone NOT NULL,
    "Ultimo_contato" timestamp with time zone,
    "Etapa_atendimento" "text",
    "User_name" "text",
    "Nome_completo" "text",
    "Telefone" "text",
    "Idade" smallint,
    "Localizacao" "text",
    "Sintomas_motivacoes" "text",
    "Origem_contato" "text",
    "Tipo_pagamento" "text",
    "Status_pagamento" "text",
    "Tipo_atendimento" "text",
    "Primeira_mensagem" "text",
    "Valor_pagamento" smallint,
    "Observacoes" "text",
    "Responsable_lead" boolean DEFAULT true NOT NULL,
    "kommo_lead_id" bigint,
    "kommo_contact_id" bigint,
    "cotato_futuro" "date",
    "followUp" smallint DEFAULT '0'::smallint
);


ALTER TABLE "develop"."whim_crm" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."whim_faq" (
    "id" bigint NOT NULL,
    "content" "text",
    "metadata" "jsonb",
    "embedding" "public"."vector"(1536)
);


ALTER TABLE "public"."whim_faq" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."whim_faq_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."whim_faq_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."whim_faq_id_seq" OWNED BY "public"."whim_faq"."id";



CREATE TABLE IF NOT EXISTS "develop"."whim_faq" (
    "id" bigint DEFAULT "nextval"('"public"."whim_faq_id_seq"'::"regclass") NOT NULL,
    "content" "text",
    "metadata" "jsonb",
    "embedding" "public"."vector"(1536)
);


ALTER TABLE "develop"."whim_faq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."whim_objecoes" (
    "id" bigint NOT NULL,
    "content" "text",
    "metadata" "jsonb",
    "embedding" "public"."vector"(1536)
);


ALTER TABLE "public"."whim_objecoes" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."whim_objecoes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."whim_objecoes_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."whim_objecoes_id_seq" OWNED BY "public"."whim_objecoes"."id";



CREATE TABLE IF NOT EXISTS "develop"."whim_objecoes" (
    "id" bigint DEFAULT "nextval"('"public"."whim_objecoes_id_seq"'::"regclass") NOT NULL,
    "content" "text",
    "metadata" "jsonb",
    "embedding" "public"."vector"(1536)
);


ALTER TABLE "develop"."whim_objecoes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."irya_assinaturas" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "whatsapp" "text",
    "tipo_plano" "text" DEFAULT 'gratuito'::"text",
    "inicio_teste_em" timestamp with time zone DEFAULT "now"(),
    "fim_teste_em" timestamp with time zone DEFAULT ("now"() + '3 days'::interval),
    "fim_periodo_atual" timestamp with time zone,
    "data_conversao" timestamp with time zone,
    "status_pagamento" "text" DEFAULT 'ativo'::"text",
    "criado_em" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "irya_assinaturas_status_pagamento_check" CHECK (("status_pagamento" = ANY (ARRAY['ativo'::"text", 'atrasado'::"text", 'cancelado'::"text", 'reembolsado'::"text"])))
);


ALTER TABLE "public"."irya_assinaturas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."irya_catalogo_micrometas" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "pilar" "text" NOT NULL,
    "intensidade" integer NOT NULL,
    "categoria_acao" "text",
    "descricao" "text" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    CONSTRAINT "irya_catalogo_micrometas_categoria_acao_check" CHECK (("categoria_acao" = ANY (ARRAY['Consciência'::"text", 'Ação Prática'::"text", 'Ajuste Ambiental'::"text", 'Ritual Estruturado'::"text", 'Redução de Risco'::"text", 'Reflexão Guiada'::"text"]))),
    CONSTRAINT "irya_catalogo_micrometas_intensidade_check" CHECK (("intensidade" = ANY (ARRAY[1, 2, 3]))),
    CONSTRAINT "irya_catalogo_micrometas_pilar_check" CHECK (("pilar" = ANY (ARRAY['sono'::"text", 'nutricao'::"text", 'movimento'::"text", 'estresse'::"text", 'conectividade'::"text", 'evitar_substancias'::"text"])))
);


ALTER TABLE "public"."irya_catalogo_micrometas" OWNER TO "postgres";


COMMENT ON TABLE "public"."irya_catalogo_micrometas" IS 'Catálogo estruturado das micro-metas (mín. 360) validadas para a Irya sortear/sugerir.';



CREATE TABLE IF NOT EXISTS "public"."irya_dados_clinicos" (
    "whatsapp" "text" NOT NULL,
    "peso" double precision,
    "altura" double precision,
    "imc" double precision,
    "sobrepeso" boolean DEFAULT false,
    "fase_hormonal" "text",
    "lipedema" boolean DEFAULT false,
    "resistencia_insulinica" boolean DEFAULT false,
    "sintomas_menopausa_intensos" boolean DEFAULT false,
    "uso_hormonios" boolean DEFAULT false,
    "tem_filhos" boolean,
    "tem_pets" boolean,
    "profissao" "text",
    "carga_horaria_trabalho" "text",
    "maior_desafio" "text",
    "objetivo_irya" "text",
    "objetivo_corporal" "text",
    "sinais_vermelhos" "jsonb" DEFAULT '{}'::"jsonb",
    "ultima_atualizacao" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "dados_pre_consulta" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "irya_dados_clinicos_fase_hormonal_check" CHECK (("fase_hormonal" = ANY (ARRAY['pre'::"text", 'transicao'::"text", 'peri'::"text", 'pos'::"text"])))
);


ALTER TABLE "public"."irya_dados_clinicos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."irya_dados_mev" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "whatsapp" "text",
    "data_preenchimento" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "score_nutricao" integer,
    "score_movimento" integer,
    "score_sono" integer,
    "score_emocoes" integer,
    "score_conexoes" integer,
    "score_total" integer,
    "percentual_vitalidade" integer,
    "classificacao_vitalidade" "text",
    "dor_principal" "text",
    "melhorias_identificadas" "text",
    "criado_em" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "respostas_brutas" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "irya_dados_mev_classificacao_vitalidade_check" CHECK (("classificacao_vitalidade" = ANY (ARRAY['Em reestruturação'::"text", 'Em evolução'::"text", 'Hábitos Saudáveis'::"text", 'Vitalidade Plena'::"text"]))),
    CONSTRAINT "irya_dados_mev_percentual_vitalidade_check" CHECK ((("percentual_vitalidade" >= 0) AND ("percentual_vitalidade" <= 100))),
    CONSTRAINT "irya_dados_mev_score_conexoes_check" CHECK ((("score_conexoes" >= 0) AND ("score_conexoes" <= 18))),
    CONSTRAINT "irya_dados_mev_score_emocoes_check" CHECK ((("score_emocoes" >= 0) AND ("score_emocoes" <= 9))),
    CONSTRAINT "irya_dados_mev_score_movimento_check" CHECK ((("score_movimento" >= 0) AND ("score_movimento" <= 9))),
    CONSTRAINT "irya_dados_mev_score_nutricao_check" CHECK ((("score_nutricao" >= 0) AND ("score_nutricao" <= 24))),
    CONSTRAINT "irya_dados_mev_score_sono_check" CHECK ((("score_sono" >= 0) AND ("score_sono" <= 15))),
    CONSTRAINT "irya_dados_mev_score_total_check" CHECK ((("score_total" >= 0) AND ("score_total" <= 75)))
);


ALTER TABLE "public"."irya_dados_mev" OWNER TO "postgres";


COMMENT ON TABLE "public"."irya_dados_mev" IS 'Armazena as respostas mensais (score e classificação) do Formulário MEV.';



CREATE TABLE IF NOT EXISTS "public"."irya_faq" (
    "id" bigint NOT NULL,
    "content" "text",
    "metadata" "jsonb",
    "embedding" "public"."vector"(3072)
);


ALTER TABLE "public"."irya_faq" OWNER TO "postgres";


ALTER TABLE "public"."irya_faq" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."irya_faq_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."irya_figurinhas" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "codigo" "text" NOT NULL,
    "nome" "text" NOT NULL,
    "url_storage" "text" NOT NULL,
    "categoria" "text",
    "criado_em" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "irya_figurinhas_categoria_check" CHECK (("categoria" = ANY (ARRAY['celebracao'::"text", 'incentivo'::"text", 'ritual'::"text"])))
);


ALTER TABLE "public"."irya_figurinhas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."irya_gamificacao" (
    "whatsapp" "text" NOT NULL,
    "ciclo_atual_inicio" "date" DEFAULT CURRENT_DATE,
    "semana_atual" integer DEFAULT 1,
    "flor_atual" "text",
    "progresso_diario" integer DEFAULT 0,
    "consistencia_semanal" integer DEFAULT 0,
    "conquistas_paciente" "jsonb" DEFAULT '[]'::"jsonb",
    "ultima_interacao_em" timestamp with time zone DEFAULT "now"(),
    "estado_jardim" "text" DEFAULT 'semente'::"text",
    "atualizado_em" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "irya_gamificacao_estado_jardim_check" CHECK (("estado_jardim" = ANY (ARRAY['semente'::"text", 'broto'::"text", 'botao'::"text", 'flor'::"text", 'murcho'::"text"])))
);


ALTER TABLE "public"."irya_gamificacao" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."irya_guia_apoio_emocional" (
    "id" bigint NOT NULL,
    "content" "text",
    "metadata" "jsonb",
    "embedding" "public"."vector"(3072)
);


ALTER TABLE "public"."irya_guia_apoio_emocional" OWNER TO "postgres";


ALTER TABLE "public"."irya_guia_apoio_emocional" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."irya_guia_apoio_emocional_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."irya_memory" (
    "id" integer NOT NULL,
    "session_id" character varying(255) NOT NULL,
    "message" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."irya_memory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."irya_metas_mensais" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "whatsapp" "text" NOT NULL,
    "plano_anual_id" "uuid" NOT NULL,
    "mes" integer,
    "pilar_mev" "text",
    "objetivo_mes" "text",
    "status" "text" DEFAULT 'pendente'::"text",
    "criado_em" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."irya_metas_mensais" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."irya_metas_semanais" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "whatsapp" "text" NOT NULL,
    "meta_mensal_id" "uuid" NOT NULL,
    "numero_semana" integer,
    "objetivo_semana" "text",
    "nivel_intensidade" integer DEFAULT 1,
    "data_inicio_semana" "date",
    "data_fim_semana" "date",
    "status" "text" DEFAULT 'pendente'::"text",
    "dias_concluidos" integer DEFAULT 0,
    "score_atingimento" integer DEFAULT 0,
    "criado_em" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."irya_metas_semanais" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."irya_mev_reference" (
    "id" bigint NOT NULL,
    "content" "text",
    "metadata" "jsonb",
    "embedding" "public"."vector"(3072)
);


ALTER TABLE "public"."irya_mev_reference" OWNER TO "postgres";


ALTER TABLE "public"."irya_mev_reference" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."irya_mev_reference_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."irya_micrometas_diarias" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "whatsapp" "text" NOT NULL,
    "meta_semanal_id" "uuid" NOT NULL,
    "data_micrometa" "date",
    "descricao_micrometa" "text",
    "status" "text" DEFAULT 'pendente'::"text",
    "estado_emocional" "text",
    "comentario_paciente" "text",
    "criado_em" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "irya_micrometas_diarias_status_check" CHECK (("status" = ANY (ARRAY['pendente'::"text", 'concluida'::"text", 'falha'::"text"])))
);


ALTER TABLE "public"."irya_micrometas_diarias" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."irya_perfis" (
    "whatsapp" "text" NOT NULL,
    "nome" "text",
    "apelido" "text",
    "data_nascimento" "date",
    "idade" integer,
    "cidade" "text",
    "estado" "text",
    "canal_aquisicao" "text",
    "status" "text" DEFAULT 'lead'::"text",
    "criado_em" timestamp with time zone DEFAULT "now"(),
    "etapa_funil" "text" DEFAULT 'novo_lead'::"text",
    "interesse_produto" "text",
    "observacoes" "text",
    "ultimo_contato" timestamp with time zone DEFAULT "now"() NOT NULL,
    "disparou_followup" boolean DEFAULT false,
    "delay_proxima_resposta" integer DEFAULT 5,
    "token_formulario" "uuid",
    "formulario_ativo" boolean DEFAULT false,
    "pilares_jornada" "jsonb" DEFAULT '{"sono": false, "estresse": false, "nutricao": false, "movimento": false, "conectividade": false, "evitar_substancias": false}'::"jsonb",
    "pre_consulta_preenchida" boolean DEFAULT false,
    "formulario_mev_concluido" boolean DEFAULT false,
    "aceite_lgpd_em" timestamp with time zone,
    "versao_termo_aceito" "text",
    "cpf" character varying(14),
    "endereco" "jsonb" DEFAULT '{}'::"jsonb",
    "email" "text",
    CONSTRAINT "irya_perfis_canal_aquisicao_check" CHECK (("canal_aquisicao" = ANY (ARRAY['ads'::"text", 'organico'::"text", 'indicacao'::"text", 'clinica'::"text"]))),
    CONSTRAINT "irya_perfis_etapa_funil_check" CHECK (("etapa_funil" = ANY (ARRAY['novo_lead'::"text", 'primeiro_contato'::"text", 'qualificado'::"text", 'em_onboarding'::"text", 'mev_concluido'::"text", 'teste_gratuito'::"text", 'proposta_enviada'::"text", 'convertido'::"text", 'perdido'::"text", 'reengajamento'::"text"]))),
    CONSTRAINT "irya_perfis_status_check" CHECK (("status" = ANY (ARRAY['lead'::"text", 'teste'::"text", 'assinante'::"text", 'inativo'::"text"])))
);


ALTER TABLE "public"."irya_perfis" OWNER TO "postgres";


COMMENT ON COLUMN "public"."irya_perfis"."etapa_funil" IS 'Etapa atual no funil comercial (CRM). Separado do campo status que controla o acesso ao produto.';



COMMENT ON COLUMN "public"."irya_perfis"."interesse_produto" IS 'Interesse ou produto que a usuaria demonstrou (texto livre ou categoria).';



COMMENT ON COLUMN "public"."irya_perfis"."observacoes" IS 'Notas e observacoes livres sobre o atendimento.';



COMMENT ON COLUMN "public"."irya_perfis"."ultimo_contato" IS 'Data/hora do ultimo contato ou interacao significativa.';



COMMENT ON COLUMN "public"."irya_perfis"."disparou_followup" IS 'Indica se o follow-up automatico ja foi disparado para esta usuaria.';



COMMENT ON COLUMN "public"."irya_perfis"."pilares_jornada" IS 'Armazena os pilares mapeados pela MEVA (Plano Anual Macro) para controle de progresso.';



COMMENT ON COLUMN "public"."irya_perfis"."endereco" IS 'Campos de endereço estruturados (rua, numero, complemento, bairro, cidade, estado)';



COMMENT ON COLUMN "public"."irya_perfis"."email" IS 'Email da paciente para importacao CSV e integracao com Gestao DS';



CREATE TABLE IF NOT EXISTS "public"."irya_planos_anuais" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "whatsapp" "text" NOT NULL,
    "objetivo_principal" "text",
    "ano_vigencia" integer,
    "data_inicio" "date",
    "data_fim" "date",
    "status" "text" DEFAULT 'ativo'::"text",
    "criado_em" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."irya_planos_anuais" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."irya_rastreio_onboarding" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "whatsapp" "text",
    "tipo_fluxo" "text",
    "etapa_atual" integer DEFAULT 1,
    "respostas" "jsonb" DEFAULT '{}'::"jsonb",
    "concluido" boolean DEFAULT false,
    "ultima_interacao_em" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "irya_rastreio_onboarding_tipo_fluxo_check" CHECK (("tipo_fluxo" = ANY (ARRAY['pre_mev'::"text", 'pos_assinatura'::"text", 'freemium'::"text"])))
);


ALTER TABLE "public"."irya_rastreio_onboarding" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."irya_rituais_diarios" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "whatsapp" "text",
    "data" "date" DEFAULT CURRENT_DATE,
    "caminho_manha" "text",
    "manha_enviada" boolean DEFAULT false,
    "meio_dia_enviado" boolean DEFAULT false,
    "noite_enviada" boolean DEFAULT false,
    "insight_semanal_enviado" boolean DEFAULT false,
    "checkin_diario_realizado" boolean DEFAULT false,
    "criado_em" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "irya_rituais_diarios_caminho_manha_check" CHECK (("caminho_manha" = ANY (ARRAY['calma'::"text", 'energia'::"text", 'foco'::"text"])))
);


ALTER TABLE "public"."irya_rituais_diarios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lead_atendimento_eventos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "agent_id" "uuid",
    "contact_id" "text" NOT NULL,
    "lead_id" "text",
    "tipo_evento" "text" NOT NULL,
    "origem_atendimento" "text" NOT NULL,
    "destino_atendimento" "text" NOT NULL,
    "actor_tipo" "text" NOT NULL,
    "actor_id" "text",
    "actor_nome" "text",
    "motivo" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chk_lead_atendimento_actor_tipo" CHECK (("actor_tipo" = ANY (ARRAY['admin'::"text", 'owner'::"text", 'seller'::"text", 'system'::"text", 'webhook'::"text"]))),
    CONSTRAINT "chk_lead_atendimento_destino" CHECK (("destino_atendimento" = ANY (ARRAY['ia'::"text", 'humano'::"text"]))),
    CONSTRAINT "chk_lead_atendimento_origem" CHECK (("origem_atendimento" = ANY (ARRAY['ia'::"text", 'humano'::"text"]))),
    CONSTRAINT "chk_lead_atendimento_tipo_evento" CHECK (("tipo_evento" = ANY (ARRAY['transferido_para_humano'::"text", 'retornado_para_ia'::"text"])))
);


ALTER TABLE "public"."lead_atendimento_eventos" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."lilly_memory_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."lilly_memory_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lilly_memory_id_seq" OWNED BY "public"."irya_memory"."id";



CREATE TABLE IF NOT EXISTS "public"."whim_crm" (
    "remoteJid" "text" NOT NULL,
    "Data_oportunidade" timestamp with time zone NOT NULL,
    "Ultimo_contato" timestamp with time zone,
    "Etapa_atendimento" "text",
    "User_name" "text",
    "Nome_completo" "text",
    "Telefone" "text",
    "Idade" smallint,
    "Localizacao" "text",
    "Sintomas_motivacoes" "text",
    "Origem_contato" "jsonb",
    "Tipo_pagamento" "text",
    "Status_pagamento" "text",
    "Tipo_atendimento" "text",
    "Primeira_mensagem" "text",
    "Valor_pagamento" smallint,
    "Observacoes" "text",
    "Responsable_lead" boolean DEFAULT true NOT NULL,
    "kommo_lead_id" bigint,
    "kommo_contact_id" bigint,
    "cotato_futuro" "date",
    "followUp" smallint DEFAULT 0,
    "disparou_followup" boolean DEFAULT false NOT NULL,
    "bloqueado" boolean DEFAULT false
);


ALTER TABLE "public"."whim_crm" OWNER TO "postgres";


COMMENT ON TABLE "public"."whim_crm" IS 'Dados do atendimento da Flora';



ALTER TABLE ONLY "public"."flora_memory" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."teste_flora_memory_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."irya_memory" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."lilly_memory_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."whim_consultas" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."whim_consultas_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."whim_faq" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."whim_faq_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."whim_objecoes" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."whim_objecoes_id_seq"'::"regclass");



ALTER TABLE ONLY "develop"."flora_memory"
    ADD CONSTRAINT "flora_memory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "develop"."whim_consultas"
    ADD CONSTRAINT "whim_consultas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "develop"."whim_crm"
    ADD CONSTRAINT "whim_crm_pkey" PRIMARY KEY ("remoteJid");



ALTER TABLE ONLY "develop"."whim_faq"
    ADD CONSTRAINT "whim_faq_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "develop"."whim_objecoes"
    ADD CONSTRAINT "whim_objecoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."irya_assinaturas"
    ADD CONSTRAINT "irya_assinaturas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."irya_catalogo_micrometas"
    ADD CONSTRAINT "irya_catalogo_micrometas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."irya_dados_clinicos"
    ADD CONSTRAINT "irya_dados_clinicos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."irya_dados_mev"
    ADD CONSTRAINT "irya_dados_mev_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."irya_faq"
    ADD CONSTRAINT "irya_faq_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."irya_figurinhas"
    ADD CONSTRAINT "irya_figurinhas_codigo_key" UNIQUE ("codigo");



ALTER TABLE ONLY "public"."irya_figurinhas"
    ADD CONSTRAINT "irya_figurinhas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."irya_gamificacao"
    ADD CONSTRAINT "irya_gamificacao_pkey" PRIMARY KEY ("whatsapp");



ALTER TABLE ONLY "public"."irya_guia_apoio_emocional"
    ADD CONSTRAINT "irya_guia_apoio_emocional_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."irya_metas_mensais"
    ADD CONSTRAINT "irya_metas_mensais_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."irya_metas_semanais"
    ADD CONSTRAINT "irya_metas_semanais_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."irya_mev_reference"
    ADD CONSTRAINT "irya_mev_reference_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."irya_micrometas_diarias"
    ADD CONSTRAINT "irya_micrometas_diarias_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."irya_perfis"
    ADD CONSTRAINT "irya_perfis_pkey" PRIMARY KEY ("whatsapp");



ALTER TABLE ONLY "public"."irya_perfis"
    ADD CONSTRAINT "irya_perfis_token_formulario_key" UNIQUE ("token_formulario");



ALTER TABLE ONLY "public"."irya_planos_anuais"
    ADD CONSTRAINT "irya_planos_anuais_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."irya_rastreio_onboarding"
    ADD CONSTRAINT "irya_rastreio_onboarding_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."irya_rastreio_onboarding"
    ADD CONSTRAINT "irya_rastreio_onboarding_whatsapp_key" UNIQUE ("whatsapp");



ALTER TABLE ONLY "public"."irya_rastreio_onboarding"
    ADD CONSTRAINT "irya_rastreio_onboarding_whatsapp_tipo_fluxo_key" UNIQUE ("whatsapp", "tipo_fluxo");



ALTER TABLE ONLY "public"."irya_rituais_diarios"
    ADD CONSTRAINT "irya_rituais_diarios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."irya_rituais_diarios"
    ADD CONSTRAINT "irya_rituais_diarios_whatsapp_data_key" UNIQUE ("whatsapp", "data");



ALTER TABLE ONLY "public"."lead_atendimento_eventos"
    ADD CONSTRAINT "lead_atendimento_eventos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."irya_memory"
    ADD CONSTRAINT "lilly_memory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."flora_memory"
    ADD CONSTRAINT "teste_flora_memory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."whim_consultas"
    ADD CONSTRAINT "whim_consultas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."whim_crm"
    ADD CONSTRAINT "whim_crm_pkey" PRIMARY KEY ("remoteJid");



ALTER TABLE ONLY "public"."whim_faq"
    ADD CONSTRAINT "whim_faq_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."whim_objecoes"
    ADD CONSTRAINT "whim_objecoes_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_irya_onboarding_fluxo" ON "public"."irya_rastreio_onboarding" USING "btree" ("whatsapp", "tipo_fluxo");



CREATE INDEX "idx_irya_perfis_status" ON "public"."irya_perfis" USING "btree" ("status");



CREATE INDEX "idx_irya_rituais_data" ON "public"."irya_rituais_diarios" USING "btree" ("whatsapp", "data");



CREATE INDEX "idx_lead_atendimento_eventos_agent" ON "public"."lead_atendimento_eventos" USING "btree" ("agent_id", "created_at" DESC);



CREATE INDEX "idx_lead_atendimento_eventos_client_contact" ON "public"."lead_atendimento_eventos" USING "btree" ("client_id", "contact_id", "created_at" DESC);



CREATE OR REPLACE TRIGGER "trigger_irya_novo_perfil" AFTER INSERT ON "public"."irya_perfis" FOR EACH ROW EXECUTE FUNCTION "public"."irya_criar_registros_iniciais"();



ALTER TABLE ONLY "public"."irya_assinaturas"
    ADD CONSTRAINT "irya_assinaturas_whatsapp_fkey" FOREIGN KEY ("whatsapp") REFERENCES "public"."irya_perfis"("whatsapp") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."irya_dados_clinicos"
    ADD CONSTRAINT "irya_dados_clinicos_whatsapp_fkey" FOREIGN KEY ("whatsapp") REFERENCES "public"."irya_perfis"("whatsapp") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."irya_dados_mev"
    ADD CONSTRAINT "irya_dados_mev_whatsapp_fkey" FOREIGN KEY ("whatsapp") REFERENCES "public"."irya_perfis"("whatsapp") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."irya_gamificacao"
    ADD CONSTRAINT "irya_gamificacao_whatsapp_fkey" FOREIGN KEY ("whatsapp") REFERENCES "public"."irya_perfis"("whatsapp") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."irya_metas_mensais"
    ADD CONSTRAINT "irya_metas_mensais_plano_anual_id_fkey" FOREIGN KEY ("plano_anual_id") REFERENCES "public"."irya_planos_anuais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."irya_metas_mensais"
    ADD CONSTRAINT "irya_metas_mensais_whatsapp_fkey" FOREIGN KEY ("whatsapp") REFERENCES "public"."irya_perfis"("whatsapp") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."irya_metas_semanais"
    ADD CONSTRAINT "irya_metas_semanais_meta_mensal_id_fkey" FOREIGN KEY ("meta_mensal_id") REFERENCES "public"."irya_metas_mensais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."irya_metas_semanais"
    ADD CONSTRAINT "irya_metas_semanais_whatsapp_fkey" FOREIGN KEY ("whatsapp") REFERENCES "public"."irya_perfis"("whatsapp") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."irya_micrometas_diarias"
    ADD CONSTRAINT "irya_micrometas_diarias_meta_semanal_id_fkey" FOREIGN KEY ("meta_semanal_id") REFERENCES "public"."irya_metas_semanais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."irya_micrometas_diarias"
    ADD CONSTRAINT "irya_micrometas_diarias_whatsapp_fkey" FOREIGN KEY ("whatsapp") REFERENCES "public"."irya_perfis"("whatsapp") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."irya_planos_anuais"
    ADD CONSTRAINT "irya_planos_anuais_whatsapp_fkey" FOREIGN KEY ("whatsapp") REFERENCES "public"."irya_perfis"("whatsapp") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."irya_rastreio_onboarding"
    ADD CONSTRAINT "irya_rastreio_onboarding_whatsapp_fkey" FOREIGN KEY ("whatsapp") REFERENCES "public"."irya_perfis"("whatsapp") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."irya_rituais_diarios"
    ADD CONSTRAINT "irya_rituais_diarios_whatsapp_fkey" FOREIGN KEY ("whatsapp") REFERENCES "public"."irya_perfis"("whatsapp") ON DELETE CASCADE;



ALTER TABLE "develop"."flora_memory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "develop"."whim_consultas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "develop"."whim_crm" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "develop"."whim_faq" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "develop"."whim_objecoes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Leitura publica de figurinhas" ON "public"."irya_figurinhas" FOR SELECT USING (true);



CREATE POLICY "Permitir leitura/escrita autenticada irya_catalogo_micrometas" ON "public"."irya_catalogo_micrometas" USING (true);



CREATE POLICY "Permitir leitura/escrita autenticada irya_dados_mev" ON "public"."irya_dados_mev" USING (true);



CREATE POLICY "Permitir tudo para autenticados" ON "public"."irya_metas_mensais" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Permitir tudo para autenticados" ON "public"."irya_metas_semanais" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Permitir tudo para autenticados" ON "public"."irya_micrometas_diarias" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Permitir tudo para autenticados" ON "public"."irya_planos_anuais" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Service role full access lead_atendimento_eventos" ON "public"."lead_atendimento_eventos" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."flora_memory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."irya_assinaturas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."irya_catalogo_micrometas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."irya_dados_clinicos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."irya_dados_mev" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."irya_faq" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."irya_figurinhas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."irya_gamificacao" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."irya_guia_apoio_emocional" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."irya_memory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."irya_metas_mensais" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."irya_metas_semanais" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."irya_mev_reference" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."irya_micrometas_diarias" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."irya_perfis" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."irya_planos_anuais" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."irya_rastreio_onboarding" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."irya_rituais_diarios" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_atendimento_eventos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."whim_consultas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."whim_crm" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."whim_faq" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."whim_objecoes" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "develop" TO "service_role";
GRANT USAGE ON SCHEMA "develop" TO "anon";
GRANT USAGE ON SCHEMA "develop" TO "authenticated";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."clone_schema"("source_schema" "text", "dest_schema" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."clone_schema"("source_schema" "text", "dest_schema" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."clone_schema"("source_schema" "text", "dest_schema" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."exec_sql"("sql_query" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."exec_sql"("sql_query" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."exec_sql"("sql_query" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_schema_columns"("p_schema_name" "text", "p_table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_schema_columns"("p_schema_name" "text", "p_table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_schema_columns"("p_schema_name" "text", "p_table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_schema_tables"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_schema_tables"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_schema_tables"() TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."irya_criar_registros_iniciais"() TO "anon";
GRANT ALL ON FUNCTION "public"."irya_criar_registros_iniciais"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."irya_criar_registros_iniciais"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."match_irya_faq"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."match_irya_faq"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_irya_faq"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."match_irya_guia_apoio_emocional"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."match_irya_guia_apoio_emocional"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_irya_guia_apoio_emocional"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."match_irya_mev_reference"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."match_irya_mev_reference"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_irya_mev_reference"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."match_whim_consultas"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."match_whim_consultas"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_whim_consultas"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."match_whim_faq"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."match_whim_faq"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_whim_faq"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."match_whim_objecoes"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."match_whim_objecoes"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_whim_objecoes"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."match_whim_perguntas_respostas"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."match_whim_perguntas_respostas"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_whim_perguntas_respostas"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."match_whim_servicos"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."match_whim_servicos"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_whim_servicos"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "service_role";












GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "service_role";



GRANT ALL ON TABLE "public"."flora_memory" TO "anon";
GRANT ALL ON TABLE "public"."flora_memory" TO "authenticated";
GRANT ALL ON TABLE "public"."flora_memory" TO "service_role";



GRANT ALL ON SEQUENCE "public"."teste_flora_memory_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."teste_flora_memory_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."teste_flora_memory_id_seq" TO "service_role";



GRANT ALL ON TABLE "develop"."flora_memory" TO "service_role";
GRANT ALL ON TABLE "develop"."flora_memory" TO "anon";
GRANT ALL ON TABLE "develop"."flora_memory" TO "authenticated";



GRANT ALL ON TABLE "public"."whim_consultas" TO "anon";
GRANT ALL ON TABLE "public"."whim_consultas" TO "authenticated";
GRANT ALL ON TABLE "public"."whim_consultas" TO "service_role";



GRANT ALL ON SEQUENCE "public"."whim_consultas_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."whim_consultas_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."whim_consultas_id_seq" TO "service_role";



GRANT ALL ON TABLE "develop"."whim_consultas" TO "service_role";
GRANT ALL ON TABLE "develop"."whim_consultas" TO "anon";
GRANT ALL ON TABLE "develop"."whim_consultas" TO "authenticated";



GRANT ALL ON TABLE "develop"."whim_crm" TO "service_role";
GRANT ALL ON TABLE "develop"."whim_crm" TO "anon";
GRANT ALL ON TABLE "develop"."whim_crm" TO "authenticated";



GRANT ALL ON TABLE "public"."whim_faq" TO "anon";
GRANT ALL ON TABLE "public"."whim_faq" TO "authenticated";
GRANT ALL ON TABLE "public"."whim_faq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."whim_faq_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."whim_faq_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."whim_faq_id_seq" TO "service_role";



GRANT ALL ON TABLE "develop"."whim_faq" TO "service_role";
GRANT ALL ON TABLE "develop"."whim_faq" TO "anon";
GRANT ALL ON TABLE "develop"."whim_faq" TO "authenticated";



GRANT ALL ON TABLE "public"."whim_objecoes" TO "anon";
GRANT ALL ON TABLE "public"."whim_objecoes" TO "authenticated";
GRANT ALL ON TABLE "public"."whim_objecoes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."whim_objecoes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."whim_objecoes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."whim_objecoes_id_seq" TO "service_role";



GRANT ALL ON TABLE "develop"."whim_objecoes" TO "service_role";
GRANT ALL ON TABLE "develop"."whim_objecoes" TO "anon";
GRANT ALL ON TABLE "develop"."whim_objecoes" TO "authenticated";









GRANT ALL ON TABLE "public"."irya_assinaturas" TO "anon";
GRANT ALL ON TABLE "public"."irya_assinaturas" TO "authenticated";
GRANT ALL ON TABLE "public"."irya_assinaturas" TO "service_role";



GRANT ALL ON TABLE "public"."irya_catalogo_micrometas" TO "anon";
GRANT ALL ON TABLE "public"."irya_catalogo_micrometas" TO "authenticated";
GRANT ALL ON TABLE "public"."irya_catalogo_micrometas" TO "service_role";



GRANT ALL ON TABLE "public"."irya_dados_clinicos" TO "anon";
GRANT ALL ON TABLE "public"."irya_dados_clinicos" TO "authenticated";
GRANT ALL ON TABLE "public"."irya_dados_clinicos" TO "service_role";



GRANT ALL ON TABLE "public"."irya_dados_mev" TO "anon";
GRANT ALL ON TABLE "public"."irya_dados_mev" TO "authenticated";
GRANT ALL ON TABLE "public"."irya_dados_mev" TO "service_role";



GRANT ALL ON TABLE "public"."irya_faq" TO "anon";
GRANT ALL ON TABLE "public"."irya_faq" TO "authenticated";
GRANT ALL ON TABLE "public"."irya_faq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."irya_faq_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."irya_faq_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."irya_faq_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."irya_figurinhas" TO "anon";
GRANT ALL ON TABLE "public"."irya_figurinhas" TO "authenticated";
GRANT ALL ON TABLE "public"."irya_figurinhas" TO "service_role";



GRANT ALL ON TABLE "public"."irya_gamificacao" TO "anon";
GRANT ALL ON TABLE "public"."irya_gamificacao" TO "authenticated";
GRANT ALL ON TABLE "public"."irya_gamificacao" TO "service_role";



GRANT ALL ON TABLE "public"."irya_guia_apoio_emocional" TO "anon";
GRANT ALL ON TABLE "public"."irya_guia_apoio_emocional" TO "authenticated";
GRANT ALL ON TABLE "public"."irya_guia_apoio_emocional" TO "service_role";



GRANT ALL ON SEQUENCE "public"."irya_guia_apoio_emocional_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."irya_guia_apoio_emocional_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."irya_guia_apoio_emocional_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."irya_memory" TO "anon";
GRANT ALL ON TABLE "public"."irya_memory" TO "authenticated";
GRANT ALL ON TABLE "public"."irya_memory" TO "service_role";



GRANT ALL ON TABLE "public"."irya_metas_mensais" TO "anon";
GRANT ALL ON TABLE "public"."irya_metas_mensais" TO "authenticated";
GRANT ALL ON TABLE "public"."irya_metas_mensais" TO "service_role";



GRANT ALL ON TABLE "public"."irya_metas_semanais" TO "anon";
GRANT ALL ON TABLE "public"."irya_metas_semanais" TO "authenticated";
GRANT ALL ON TABLE "public"."irya_metas_semanais" TO "service_role";



GRANT ALL ON TABLE "public"."irya_mev_reference" TO "anon";
GRANT ALL ON TABLE "public"."irya_mev_reference" TO "authenticated";
GRANT ALL ON TABLE "public"."irya_mev_reference" TO "service_role";



GRANT ALL ON SEQUENCE "public"."irya_mev_reference_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."irya_mev_reference_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."irya_mev_reference_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."irya_micrometas_diarias" TO "anon";
GRANT ALL ON TABLE "public"."irya_micrometas_diarias" TO "authenticated";
GRANT ALL ON TABLE "public"."irya_micrometas_diarias" TO "service_role";



GRANT ALL ON TABLE "public"."irya_perfis" TO "anon";
GRANT ALL ON TABLE "public"."irya_perfis" TO "authenticated";
GRANT ALL ON TABLE "public"."irya_perfis" TO "service_role";



GRANT ALL ON TABLE "public"."irya_planos_anuais" TO "anon";
GRANT ALL ON TABLE "public"."irya_planos_anuais" TO "authenticated";
GRANT ALL ON TABLE "public"."irya_planos_anuais" TO "service_role";



GRANT ALL ON TABLE "public"."irya_rastreio_onboarding" TO "anon";
GRANT ALL ON TABLE "public"."irya_rastreio_onboarding" TO "authenticated";
GRANT ALL ON TABLE "public"."irya_rastreio_onboarding" TO "service_role";



GRANT ALL ON TABLE "public"."irya_rituais_diarios" TO "anon";
GRANT ALL ON TABLE "public"."irya_rituais_diarios" TO "authenticated";
GRANT ALL ON TABLE "public"."irya_rituais_diarios" TO "service_role";



GRANT ALL ON TABLE "public"."lead_atendimento_eventos" TO "anon";
GRANT ALL ON TABLE "public"."lead_atendimento_eventos" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_atendimento_eventos" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lilly_memory_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lilly_memory_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lilly_memory_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."whim_crm" TO "anon";
GRANT ALL ON TABLE "public"."whim_crm" TO "authenticated";
GRANT ALL ON TABLE "public"."whim_crm" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "develop" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "develop" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "develop" GRANT ALL ON TABLES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";


