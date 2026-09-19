-- ============================================================================
-- Aeternum Atlas Canonical Fresh-Install Baseline Snapshot
-- CUTOVER VERSION: 202608240002_vault_privilege_hardening.sql
-- CUTOVER DATE: 2026-08-24
-- MODEL: FINAL_STATE_SNAPSHOT
-- CANONICAL TABLES: 46 (42 Domain + 4 Legacy Runtime Required)
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA extensions;

-- Canonical Infrastructure Metadata: Storage Bucket for 3D Models
INSERT INTO storage.buckets (id, name, public)
VALUES ('atlas-model-assets', 'atlas-model-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Public Schema
CREATE SCHEMA IF NOT EXISTS public;

--
-- PostgreSQL database dump
--

\restrict UVDFKHz07B4BL7qYZi1jwSFJ6uJB7nPynSlB8bWJhxv6Tv8Gng3FIgGD6A16jZN

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--




--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--




--
-- Name: invoice_calculation_result; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.invoice_calculation_result AS (
	invoice_id uuid,
	institution_id uuid,
	billing_cycle_id uuid,
	licensed_students integer,
	consumed_students integer,
	excess_students integer,
	total_amount numeric(10,2),
	status character varying(50)
);


--
-- Name: can_read_atlas_model(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_read_atlas_model(target_model_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth'
    AS $$
DECLARE
  caller UUID := auth.uid();
  user_role TEXT;
  caller_institution UUID;
  model_status TEXT;
  inst_availability JSONB;
BEGIN
  IF caller IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT role, institution_id INTO user_role, caller_institution
  FROM public.users WHERE id = caller AND status IN ('active', 'ativo');

  IF user_role IN ('admin', 'super_admin') THEN
    RETURN TRUE;
  END IF;

  SELECT status, institution_availability INTO model_status, inst_availability
  FROM public.atlas_models WHERE id = target_model_id;

  IF model_status = 'published' THEN
    IF inst_availability IS NULL OR inst_availability = '[]'::jsonb THEN
      RETURN TRUE;
    END IF;
    IF caller_institution IS NOT NULL AND inst_availability ? caller_institution::text THEN
      RETURN TRUE;
    END IF;
  END IF;

  RETURN FALSE;
END;
$$;


--
-- Name: consume_ai_rate_limit(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.consume_ai_rate_limit(max_requests integer DEFAULT 20, window_seconds integer DEFAULT 60) RETURNS TABLE(allowed boolean, remaining integer, retry_after_seconds integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth'
    AS $$
DECLARE
  caller UUID := auth.uid();
  limit_row public.ai_rate_limits%ROWTYPE;
  safe_max INTEGER := LEAST(GREATEST(max_requests, 1), 120);
  safe_window INTEGER := LEAST(GREATEST(window_seconds, 10), 3600);
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória.';
  END IF;

  INSERT INTO public.ai_rate_limits (user_id, window_started_at, request_count, updated_at)
  VALUES (caller, NOW(), 1, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET
    window_started_at = CASE
      WHEN public.ai_rate_limits.window_started_at <= NOW() - make_interval(secs => safe_window)
        THEN NOW()
      ELSE public.ai_rate_limits.window_started_at
    END,
    request_count = CASE
      WHEN public.ai_rate_limits.window_started_at <= NOW() - make_interval(secs => safe_window)
        THEN 1
      ELSE public.ai_rate_limits.request_count + 1
    END,
    updated_at = NOW()
  RETURNING * INTO limit_row;

  allowed := limit_row.request_count <= safe_max;
  remaining := GREATEST(safe_max - limit_row.request_count, 0);
  retry_after_seconds := CASE
    WHEN allowed THEN 0
    ELSE GREATEST(
      1,
      safe_window - FLOOR(EXTRACT(EPOCH FROM (NOW() - limit_row.window_started_at)))::INTEGER
    )
  END;
  RETURN NEXT;
END;
$$;


--
-- Name: consume_voice_rate_limit(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.consume_voice_rate_limit() RETURNS TABLE(allowed boolean, retry_after_seconds integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_user_id uuid := auth.uid();
  v_window_started_at timestamptz;
  v_request_count integer;
  v_now timestamptz := clock_timestamp();
  v_limit constant integer := 8;
  v_window_seconds constant integer := 60;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  insert into public.vita_voice_rate_limits as limits (
    user_id,
    window_started_at,
    request_count,
    updated_at
  )
  values (v_user_id, v_now, 1, v_now)
  on conflict (user_id) do update
  set
    window_started_at = case
      when limits.window_started_at <= v_now - make_interval(secs => v_window_seconds)
        then v_now
      else limits.window_started_at
    end,
    request_count = case
      when limits.window_started_at <= v_now - make_interval(secs => v_window_seconds)
        then 1
      else limits.request_count + 1
    end,
    updated_at = v_now
  returning limits.window_started_at, limits.request_count
    into v_window_started_at, v_request_count;

  return query select
    v_request_count <= v_limit,
    case
      when v_request_count <= v_limit then 0
      else greatest(1, ceil(extract(epoch from (
        v_window_started_at + make_interval(secs => v_window_seconds) - v_now
      )))::integer)
    end;
end;
$$;


--
-- Name: FUNCTION consume_voice_rate_limit(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.consume_voice_rate_limit() IS 'Atomic authenticated limiter for Aeternum Vita voice token issuance.';


--
-- Name: current_user_institution_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.current_user_institution_id() RETURNS uuid
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
DECLARE
  res UUID;
BEGIN
  SELECT institution_id INTO res FROM public.users WHERE id = auth.uid();
  RETURN res;
END;
$$;


--
-- Name: current_user_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.current_user_role() RETURNS text
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
DECLARE
  res TEXT;
BEGIN
  SELECT role INTO res FROM public.users WHERE id = auth.uid();
  RETURN res;
END;
$$;


--
-- Name: enforce_learning_identity(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_learning_identity() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth'
    AS $$
DECLARE
  caller UUID := auth.uid();
  caller_institution UUID;
BEGIN
  IF caller IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT profile.institution_id
  INTO caller_institution
  FROM public.users AS profile
  WHERE profile.id = caller AND profile.status IN ('active', 'ativo');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil ativo não encontrado para a identidade autenticada.';
  END IF;

  NEW.user_id := caller;
  NEW.institution_id := caller_institution;
  RETURN NEW;
END;
$$;


--
-- Name: enforce_study_agenda_identity(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_study_agenda_identity() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
  actor public.users%ROWTYPE;
BEGIN
  SELECT * INTO actor FROM public.users WHERE id = auth.uid();
  IF actor.id IS NULL OR lower(coalesce(actor.status, '')) NOT IN ('active', 'ativo') THEN
    RAISE EXCEPTION 'Perfil ativo obrigatório para usar a agenda.';
  END IF;

  NEW.user_id := actor.id;
  NEW.institution_id := actor.institution_id;
  NEW.creator_name := coalesce(nullif(actor.name, ''), actor.email, 'Usuário');
  NEW.created_by_role := CASE lower(coalesce(actor.role, 'student'))
    WHEN 'teacher' THEN 'teacher'
    WHEN 'professor' THEN 'teacher'
    WHEN 'coordinator' THEN 'institution'
    WHEN 'coordenador' THEN 'institution'
    WHEN 'rector' THEN 'institution'
    WHEN 'reitor' THEN 'institution'
    WHEN 'admin' THEN 'institution'
    WHEN 'institution_admin' THEN 'institution'
    WHEN 'super_admin' THEN 'institution'
    ELSE 'student'
  END;
  IF NEW.created_by_role = 'student' THEN
    NEW.is_shared_with_students := false;
    NEW.target_group := 'self';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


--
-- Name: generate_monthly_invoice(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_monthly_invoice(p_institution_id uuid, p_billing_cycle_id uuid) RETURNS SETOF public.invoice_calculation_result
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN;
END;
$$;


--
-- Name: get_system_secret(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_system_secret(p_name text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'vault', 'pg_temp'
    AS $$
DECLARE
  v_secret text;
BEGIN
  -- Whitelist estrita de nomes autorizados
  IF p_name NOT IN ('LIVEKIT_PUBLIC_URL', 'LIVEKIT_URL', 'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET') THEN
    RAISE EXCEPTION 'Acesso negado: chave de sistema nao autorizada.' USING ERRCODE = '42501';
  END IF;

  SELECT decrypted_secret INTO v_secret 
  FROM vault.decrypted_secrets 
  WHERE name = p_name 
  LIMIT 1;

  RETURN v_secret;
END;
$$;


--
-- Name: match_anatomical_knowledge(extensions.vector, double precision, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.match_anatomical_knowledge(query_embedding extensions.vector, match_threshold double precision DEFAULT 0.52, match_count integer DEFAULT 6) RETURNS TABLE(id uuid, book_title text, chapter_title text, page_number integer, content text, similarity double precision)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
  SELECT
    knowledge.id,
    knowledge.book_title,
    knowledge.chapter_title,
    knowledge.page_number,
    knowledge.content,
    (1 - (knowledge.embedding <=> query_embedding))::DOUBLE PRECISION AS similarity
  FROM public.anatomical_knowledge_base AS knowledge
  WHERE (1 - (knowledge.embedding <=> query_embedding)) > LEAST(GREATEST(match_threshold, 0), 1)
  ORDER BY knowledge.embedding <=> query_embedding
  LIMIT LEAST(GREATEST(match_count, 1), 12);
$$;


--
-- Name: match_vita_anatomical_knowledge(text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.match_vita_anatomical_knowledge(search_query text, match_count integer DEFAULT 8) RETURNS TABLE(id uuid, book_title text, page_number integer, content text, lexical_rank double precision)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  WITH parameters AS (
    SELECT
      NULLIF(btrim(search_query), '') AS terms,
      LEAST(GREATEST(match_count, 1), 12) AS result_limit
  ),
  ranked AS (
    SELECT
      knowledge.id,
      knowledge.book_title,
      knowledge.page_number,
      knowledge.content,
      ts_rank_cd(
        to_tsvector(
          'simple',
          coalesce(knowledge.book_title, '') || ' ' || coalesce(knowledge.content, '')
        ),
        websearch_to_tsquery('simple', parameters.terms),
        32
      )::DOUBLE PRECISION AS lexical_rank,
      parameters.result_limit
    FROM public.vita_anatomical_knowledge AS knowledge
    CROSS JOIN parameters
    WHERE parameters.terms IS NOT NULL
  )
  SELECT ranked.id, ranked.book_title, ranked.page_number, ranked.content, ranked.lexical_rank
  FROM ranked
  WHERE ranked.lexical_rank > 0
  ORDER BY ranked.lexical_rank DESC, ranked.page_number
  LIMIT (SELECT result_limit FROM parameters);
$$;


--
-- Name: FUNCTION match_vita_anatomical_knowledge(search_query text, match_count integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.match_vita_anatomical_knowledge(search_query text, match_count integer) IS 'Busca textual privada e exclusiva do agente de voz Aeternum Vita.';


--
-- Name: reconcile_all_stale_learning_sessions(interval); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reconcile_all_stale_learning_sessions(stale_after interval DEFAULT '00:03:00'::interval) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth'
    AS $$
DECLARE
  reconciled INTEGER;
BEGIN
  UPDATE public.viewer_learning_sessions
  SET
    session_end = COALESCE(session_end, last_heartbeat_at),
    duration_seconds = GREATEST(active_seconds, 0),
    status = 'abandoned',
    ended_reason = COALESCE(ended_reason, 'heartbeat_timeout'),
    updated_at = NOW()
  WHERE status = 'active'
    AND last_heartbeat_at < NOW() - GREATEST(stale_after, INTERVAL '90 seconds');

  GET DIAGNOSTICS reconciled = ROW_COUNT;
  RETURN reconciled;
END;
$$;


--
-- Name: reconcile_my_learning_sessions(interval); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reconcile_my_learning_sessions(stale_after interval DEFAULT '00:03:00'::interval) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth'
    AS $$
DECLARE
  reconciled INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória.';
  END IF;

  UPDATE public.viewer_learning_sessions
  SET
    session_end = COALESCE(session_end, last_heartbeat_at),
    duration_seconds = GREATEST(active_seconds, 0),
    status = 'abandoned',
    ended_reason = COALESCE(ended_reason, 'heartbeat_timeout'),
    updated_at = NOW()
  WHERE user_id = auth.uid()
    AND status = 'active'
    AND last_heartbeat_at < NOW() - GREATEST(stale_after, INTERVAL '90 seconds');

  GET DIAGNOSTICS reconciled = ROW_COUNT;
  RETURN reconciled;
END;
$$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: touch_model_annotations_sync(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.touch_model_annotations_sync() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: academic_class_students; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.academic_class_students (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    institution_id uuid NOT NULL,
    class_id uuid NOT NULL,
    student_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: academic_classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.academic_classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    institution_id uuid NOT NULL,
    teacher_id uuid NOT NULL,
    name text NOT NULL,
    course text,
    semester text,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT academic_classes_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'archived'::text])))
);


--
-- Name: ai_audit_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_audit_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    institution_id uuid,
    conversation_id uuid,
    event_type text NOT NULL,
    model_name text,
    input_characters integer DEFAULT 0 NOT NULL,
    output_characters integer DEFAULT 0 NOT NULL,
    success boolean DEFAULT false NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ai_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    institution_id uuid,
    title text DEFAULT 'Conversa com Atlas AI'::text NOT NULL,
    context jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ai_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ai_messages_content_check CHECK (((char_length(content) >= 1) AND (char_length(content) <= 8000))),
    CONSTRAINT ai_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text])))
);


--
-- Name: ai_rate_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_rate_limits (
    user_id uuid NOT NULL,
    window_started_at timestamp with time zone DEFAULT now() NOT NULL,
    request_count integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ai_rate_limits_request_count_check CHECK ((request_count >= 0))
);


--
-- Name: anatomical_knowledge_base; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.anatomical_knowledge_base (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    book_title text NOT NULL,
    chapter_title text,
    page_number integer,
    chunk_index integer NOT NULL,
    content text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    embedding extensions.vector(768) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT anatomical_knowledge_base_chunk_index_check CHECK ((chunk_index >= 0)),
    CONSTRAINT anatomical_knowledge_base_content_check CHECK (((char_length(content) >= 40) AND (char_length(content) <= 12000))),
    CONSTRAINT anatomical_knowledge_base_page_number_check CHECK (((page_number IS NULL) OR (page_number > 0)))
);


--
-- Name: TABLE anatomical_knowledge_base; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.anatomical_knowledge_base IS 'Trechos anatômicos privados usados exclusivamente pelo Tutor IA autenticado do Aeternum 26.1.';


--
-- Name: anatomical_quiz_answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.anatomical_quiz_answers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    attempt_id uuid,
    question_id uuid,
    selected_answer text NOT NULL,
    is_correct boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: anatomical_quiz_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.anatomical_quiz_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quiz_id uuid,
    user_id uuid,
    score numeric(5,2) DEFAULT 0 NOT NULL,
    total_questions integer DEFAULT 0 NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone
);


--
-- Name: anatomical_quiz_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.anatomical_quiz_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quiz_id uuid,
    question text NOT NULL,
    options jsonb DEFAULT '[]'::jsonb NOT NULL,
    correct_answer text NOT NULL,
    explanation text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: anatomical_quizzes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.anatomical_quizzes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    institution_id uuid,
    title text NOT NULL,
    description text,
    anatomical_system text,
    difficulty_level text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: atlas_model_annotations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atlas_model_annotations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    model_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    "position" jsonb NOT NULL,
    camera_position jsonb NOT NULL,
    target jsonb NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: atlas_model_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atlas_model_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    model_id uuid NOT NULL,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_format text NOT NULL,
    file_size bigint NOT NULL,
    asset_url text NOT NULL,
    status text DEFAULT 'processing'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT atlas_model_assets_status_check CHECK ((status = ANY (ARRAY['processing'::text, 'ready'::text, 'failed'::text])))
);


--
-- Name: atlas_model_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atlas_model_audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    model_id uuid,
    user_id uuid,
    action text NOT NULL,
    changes jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: atlas_models; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atlas_models (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text,
    title text NOT NULL,
    description text,
    anatomical_system text,
    anatomical_region text,
    difficulty_level text,
    estimated_time integer,
    status text DEFAULT 'draft'::text NOT NULL,
    viewer_type text DEFAULT 'atlas-native'::text NOT NULL,
    sketchfab_url text,
    institution_availability jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT atlas_models_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])))
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    institution_id uuid,
    action text NOT NULL,
    resource_type text NOT NULL,
    resource_id text,
    old_data jsonb,
    new_data jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: billing_cycles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_cycles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subscription_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    total_amount numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: billing_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    institution_id uuid NOT NULL,
    cycle_id uuid,
    active_students_count integer DEFAULT 0 NOT NULL,
    active_teachers_count integer DEFAULT 0 NOT NULL,
    billed_amount numeric(12,2) DEFAULT 0 NOT NULL,
    snapshot_date date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: feature_flags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feature_flags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    enabled boolean DEFAULT true NOT NULL,
    rules jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: institution_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.institution_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    institution_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    current_period_start timestamp with time zone DEFAULT now() NOT NULL,
    current_period_end timestamp with time zone NOT NULL,
    cancel_at_period_end boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT institution_subscriptions_status_check CHECK ((status = ANY (ARRAY['trial'::text, 'active'::text, 'overdue'::text, 'cancelled'::text, 'expired'::text])))
);


--
-- Name: institutions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.institutions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    country text,
    city text,
    active boolean DEFAULT true NOT NULL,
    contracted_capacity integer DEFAULT 0 NOT NULL,
    active_students integer DEFAULT 0 NOT NULL,
    price_per_student numeric(12,2) DEFAULT 0 NOT NULL,
    contract_status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: models_3d; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.models_3d (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    institution_id uuid,
    title text NOT NULL,
    slug text NOT NULL,
    anatomical_system text,
    anatomical_region text,
    sketchfab_url text,
    embed_url text,
    difficulty_level text,
    tags jsonb DEFAULT '[]'::jsonb NOT NULL,
    status text DEFAULT 'available'::text NOT NULL,
    thumbnail_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    institution_id uuid,
    name text NOT NULL,
    email text NOT NULL,
    role text DEFAULT 'student'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    avatar_url text,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['student'::text, 'teacher'::text, 'coordinator'::text, 'rector'::text, 'institution_admin'::text, 'admin'::text, 'super_admin'::text]))),
    CONSTRAINT users_status_check CHECK ((status = ANY (ARRAY['active'::text, 'ativo'::text, 'inactive'::text, 'inativo'::text, 'suspended'::text])))
);


--
-- Name: institution_usage_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.institution_usage_summary WITH (security_invoker='true') AS
 SELECT i.id AS institution_id,
    i.name AS institution_name,
    count(DISTINCT u.id) AS total_users,
    count(DISTINCT m.id) AS total_models_accessed
   FROM ((public.institutions i
     LEFT JOIN public.users u ON ((u.institution_id = i.id)))
     LEFT JOIN public.models_3d m ON ((m.institution_id = i.id)))
  GROUP BY i.id, i.name;


--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    description text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(12,2) DEFAULT 0 NOT NULL,
    total_price numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    institution_id uuid NOT NULL,
    cycle_id uuid,
    invoice_number text NOT NULL,
    amount numeric(12,2) DEFAULT 0 NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    due_date date NOT NULL,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT invoices_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'pending'::text, 'paid'::text, 'void'::text, 'overdue'::text])))
);


--
-- Name: legacy_cleanup_archive; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.legacy_cleanup_archive (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    operation_key text NOT NULL,
    source_table text NOT NULL,
    source_id text,
    source_payload jsonb NOT NULL,
    archived_at timestamp with time zone DEFAULT now() NOT NULL,
    archived_by uuid DEFAULT auth.uid()
);


--
-- Name: license_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.license_usage (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    institution_id uuid NOT NULL,
    license_type text NOT NULL,
    seats_allocated integer DEFAULT 0 NOT NULL,
    seats_used integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: model_access_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.model_access_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    institution_id uuid,
    model_id uuid,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    ended_at timestamp with time zone,
    duration_minutes integer,
    interactions_count integer DEFAULT 0 NOT NULL,
    annotations_opened integer DEFAULT 0 NOT NULL,
    device_type text
);


--
-- Name: TABLE model_access_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.model_access_logs IS 'LEGACY READ-ONLY: substituída por viewer_learning_sessions, viewer_learning_events e viewer_quiz_results no Aeternum 26.';


--
-- Name: model_annotations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.model_annotations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    institution_id uuid,
    model_id uuid,
    title text NOT NULL,
    description text,
    "position" jsonb DEFAULT '{"x": 0, "y": 0, "z": 0}'::jsonb NOT NULL,
    camera_position jsonb,
    target jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: model_popularity_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.model_popularity_summary WITH (security_invoker='true') AS
 SELECT m.id AS model_id,
    m.title,
    count(l.id) AS access_count
   FROM (public.models_3d m
     LEFT JOIN public.model_access_logs l ON ((l.model_id = m.id)))
  GROUP BY m.id, m.title;


--
-- Name: platform_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.platform_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    institution_id uuid,
    event_type text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: security_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.security_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    institution_id uuid,
    event_type text NOT NULL,
    ip_address text,
    user_agent text,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: student_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_profiles (
    user_id uuid NOT NULL,
    course text,
    semester text,
    registration_number text,
    progress_score integer DEFAULT 0 NOT NULL,
    total_study_minutes integer DEFAULT 0 NOT NULL,
    favorite_models jsonb DEFAULT '[]'::jsonb NOT NULL,
    last_access_at timestamp with time zone
);


--
-- Name: study_agenda; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.study_agenda (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    title text NOT NULL,
    description text,
    date date NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    anatomical_system text,
    linked_model_id uuid,
    status text DEFAULT 'pending'::text NOT NULL,
    reminder_enabled boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: study_agenda_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.study_agenda_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    institution_id uuid,
    created_by_role text DEFAULT 'student'::text NOT NULL,
    creator_name text NOT NULL,
    creator_avatar text,
    title text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    date date NOT NULL,
    start_time time without time zone DEFAULT '09:00:00'::time without time zone NOT NULL,
    end_time time without time zone DEFAULT '10:00:00'::time without time zone NOT NULL,
    type text DEFAULT 'study'::text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    anatomical_system text DEFAULT 'Geral'::text NOT NULL,
    linked_model text,
    linked_model_route text,
    reminder text DEFAULT 'none'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    is_shared_with_students boolean DEFAULT false NOT NULL,
    target_group text DEFAULT 'all'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    linked_flashcard_deck text,
    linked_flashcard_route text,
    CONSTRAINT study_agenda_events_check CHECK ((end_time > start_time)),
    CONSTRAINT study_agenda_events_created_by_role_check CHECK ((created_by_role = ANY (ARRAY['student'::text, 'teacher'::text, 'institution'::text, 'ai_tutor'::text]))),
    CONSTRAINT study_agenda_events_description_check CHECK ((char_length(description) <= 4000)),
    CONSTRAINT study_agenda_events_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))),
    CONSTRAINT study_agenda_events_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'canceled'::text, 'missed'::text]))),
    CONSTRAINT study_agenda_events_title_check CHECK (((char_length(title) >= 1) AND (char_length(title) <= 180))),
    CONSTRAINT study_agenda_events_type_check CHECK ((type = ANY (ARRAY['study'::text, 'review'::text, 'quiz'::text, 'exam'::text, 'task'::text, 'class'::text, 'note'::text, 'teacher_assignment'::text, 'practical_class'::text])))
);


--
-- Name: TABLE study_agenda_events; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.study_agenda_events IS 'Agenda acadêmica persistida e sincronizada do Aeternum 26.1.';


--
-- Name: COLUMN study_agenda_events.linked_flashcard_deck; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.study_agenda_events.linked_flashcard_deck IS 'Título do baralho pessoal vinculado à atividade.';


--
-- Name: COLUMN study_agenda_events.linked_flashcard_route; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.study_agenda_events.linked_flashcard_route IS 'Rota interna segura para abrir a ferramenta de flashcards.';


--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    price_monthly numeric(12,2) DEFAULT 0 NOT NULL,
    price_yearly numeric(12,2) DEFAULT 0 NOT NULL,
    features jsonb DEFAULT '[]'::jsonb NOT NULL,
    max_students integer DEFAULT 0 NOT NULL,
    max_teachers integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: teacher_anatomical_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teacher_anatomical_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    institution_id uuid NOT NULL,
    teacher_id uuid NOT NULL,
    model_id uuid,
    structure text,
    note_type text DEFAULT 'didactic'::text NOT NULL,
    description text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    visibility text DEFAULT 'private'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT teacher_anatomical_notes_note_type_check CHECK ((note_type = ANY (ARRAY['correction'::text, 'didactic'::text, 'clinical'::text, 'legend'::text, 'annotation'::text]))),
    CONSTRAINT teacher_anatomical_notes_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))),
    CONSTRAINT teacher_anatomical_notes_status_check CHECK ((status = ANY (ARRAY['open'::text, 'in_review'::text, 'resolved'::text, 'archived'::text]))),
    CONSTRAINT teacher_anatomical_notes_visibility_check CHECK ((visibility = ANY (ARRAY['private'::text, 'institution'::text, 'admin'::text])))
);


--
-- Name: teacher_lesson_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teacher_lesson_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    institution_id uuid NOT NULL,
    teacher_id uuid NOT NULL,
    class_id uuid,
    title text NOT NULL,
    scheduled_for timestamp with time zone,
    model_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    key_structures jsonb DEFAULT '[]'::jsonb NOT NULL,
    objectives jsonb DEFAULT '[]'::jsonb NOT NULL,
    notes text,
    status text DEFAULT 'planned'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT teacher_lesson_plans_status_check CHECK ((status = ANY (ARRAY['planned'::text, 'delivered'::text, 'archived'::text])))
);


--
-- Name: teacher_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teacher_profiles (
    user_id uuid NOT NULL,
    department text,
    specialization text,
    allowed_models jsonb DEFAULT '[]'::jsonb NOT NULL,
    academic_title text
);


--
-- Name: teacher_study_guides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teacher_study_guides (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    institution_id uuid NOT NULL,
    teacher_id uuid NOT NULL,
    class_id uuid,
    title text NOT NULL,
    description text,
    objectives jsonb DEFAULT '[]'::jsonb NOT NULL,
    model_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    due_date date,
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT teacher_study_guides_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'completed'::text, 'archived'::text])))
);


--
-- Name: user_engagement_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.user_engagement_summary WITH (security_invoker='true') AS
 SELECT u.id AS user_id,
    u.name,
    count(l.id) AS session_count,
    COALESCE(sum(l.duration_minutes), (0)::bigint) AS total_minutes
   FROM (public.users u
     LEFT JOIN public.model_access_logs l ON ((l.user_id = u.id)))
  GROUP BY u.id, u.name;


--
-- Name: viewer_learning_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.viewer_learning_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    event_type text NOT NULL,
    structure_id text,
    annotation_id text,
    quiz_id text,
    event_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid,
    institution_id uuid,
    model_id text
);


--
-- Name: viewer_learning_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.viewer_learning_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    institution_id uuid NOT NULL,
    model_id text,
    session_start timestamp with time zone DEFAULT now() NOT NULL,
    session_end timestamp with time zone,
    duration_seconds integer DEFAULT 0 NOT NULL,
    interactions_count integer DEFAULT 0 NOT NULL,
    annotations_opened integer DEFAULT 0 NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    client_session_id uuid,
    scope text DEFAULT 'viewer'::text NOT NULL,
    last_heartbeat_at timestamp with time zone DEFAULT now() NOT NULL,
    active_seconds integer DEFAULT 0 NOT NULL,
    idle_seconds integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    ended_reason text,
    CONSTRAINT viewer_learning_sessions_annotations_opened_check CHECK ((annotations_opened >= 0)),
    CONSTRAINT viewer_learning_sessions_check CHECK (((session_end IS NULL) OR (session_end >= session_start))),
    CONSTRAINT viewer_learning_sessions_duration_seconds_check CHECK ((duration_seconds >= 0)),
    CONSTRAINT viewer_learning_sessions_interactions_count_check CHECK ((interactions_count >= 0))
);


--
-- Name: viewer_quiz_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.viewer_quiz_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    institution_id uuid NOT NULL,
    model_id text,
    quiz_id text NOT NULL,
    correct_answers integer DEFAULT 0 NOT NULL,
    incorrect_answers integer DEFAULT 0 NOT NULL,
    accuracy numeric(5,2) DEFAULT 0 NOT NULL,
    time_spent integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'in_progress'::text NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    quiz_type text DEFAULT 'anatomical'::text NOT NULL,
    score integer DEFAULT 0 NOT NULL,
    total_questions integer DEFAULT 0 NOT NULL,
    percentage numeric DEFAULT 0 NOT NULL,
    duration_seconds integer DEFAULT 0 NOT NULL,
    finished_at timestamp with time zone,
    CONSTRAINT viewer_quiz_results_accuracy_check CHECK (((accuracy >= (0)::numeric) AND (accuracy <= (100)::numeric))),
    CONSTRAINT viewer_quiz_results_check CHECK (((completed_at IS NULL) OR (completed_at >= started_at))),
    CONSTRAINT viewer_quiz_results_correct_answers_check CHECK ((correct_answers >= 0)),
    CONSTRAINT viewer_quiz_results_incorrect_answers_check CHECK ((incorrect_answers >= 0)),
    CONSTRAINT viewer_quiz_results_status_check CHECK ((status = ANY (ARRAY['in_progress'::text, 'completed'::text, 'abandoned'::text]))),
    CONSTRAINT viewer_quiz_results_time_spent_check CHECK ((time_spent >= 0))
);


--
-- Name: TABLE viewer_quiz_results; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.viewer_quiz_results IS 'Fonte canônica dos resultados reais de simulados anatômicos e teóricos do Aeternum 26.1.';


--
-- Name: vita_anatomical_knowledge; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vita_anatomical_knowledge (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    book_title text NOT NULL,
    source_file text NOT NULL,
    source_sha256 text NOT NULL,
    page_number integer NOT NULL,
    chunk_index integer NOT NULL,
    content text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT vita_anatomical_knowledge_book_title_check CHECK (((char_length(book_title) >= 1) AND (char_length(book_title) <= 500))),
    CONSTRAINT vita_anatomical_knowledge_chunk_index_check CHECK ((chunk_index >= 0)),
    CONSTRAINT vita_anatomical_knowledge_content_check CHECK (((char_length(content) >= 40) AND (char_length(content) <= 12000))),
    CONSTRAINT vita_anatomical_knowledge_page_number_check CHECK ((page_number > 0)),
    CONSTRAINT vita_anatomical_knowledge_source_file_check CHECK (((char_length(source_file) >= 1) AND (char_length(source_file) <= 500))),
    CONSTRAINT vita_anatomical_knowledge_source_sha256_check CHECK ((source_sha256 ~ '^[0-9a-f]{64}$'::text))
);


--
-- Name: TABLE vita_anatomical_knowledge; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.vita_anatomical_knowledge IS 'Trechos bibliográficos privados e exclusivos dos tutores de voz Aeternum Vita.';


--
-- Name: vita_ocr_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vita_ocr_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    book_title text NOT NULL,
    source_file text NOT NULL,
    source_sha256 text NOT NULL,
    page_number integer NOT NULL,
    source_image_sha256 text NOT NULL,
    page_width_pixels integer NOT NULL,
    page_height_pixels integer NOT NULL,
    dpi integer NOT NULL,
    language_codes text[] DEFAULT ARRAY['eng'::text] NOT NULL,
    page_kind text DEFAULT 'unknown'::text NOT NULL,
    extraction_method text DEFAULT 'tesseract-tsv'::text NOT NULL,
    ocr_text text DEFAULT ''::text NOT NULL,
    mean_confidence numeric(5,2) DEFAULT 0 NOT NULL,
    accepted_word_count integer DEFAULT 0 NOT NULL,
    total_word_count integer DEFAULT 0 NOT NULL,
    word_boxes jsonb DEFAULT '[]'::jsonb NOT NULL,
    review_status text DEFAULT 'pending'::text NOT NULL,
    pipeline_version integer DEFAULT 1 NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT vita_ocr_pages_accepted_word_count_check CHECK ((accepted_word_count >= 0)),
    CONSTRAINT vita_ocr_pages_book_title_check CHECK (((char_length(book_title) >= 1) AND (char_length(book_title) <= 500))),
    CONSTRAINT vita_ocr_pages_dpi_check CHECK (((dpi >= 150) AND (dpi <= 600))),
    CONSTRAINT vita_ocr_pages_extraction_method_check CHECK ((extraction_method = ANY (ARRAY['tesseract-tsv'::text, 'digital-text'::text, 'manual-review'::text]))),
    CONSTRAINT vita_ocr_pages_mean_confidence_check CHECK (((mean_confidence >= (0)::numeric) AND (mean_confidence <= (100)::numeric))),
    CONSTRAINT vita_ocr_pages_metadata_check CHECK ((jsonb_typeof(metadata) = 'object'::text)),
    CONSTRAINT vita_ocr_pages_ocr_text_check CHECK ((char_length(ocr_text) <= 200000)),
    CONSTRAINT vita_ocr_pages_page_height_pixels_check CHECK ((page_height_pixels > 0)),
    CONSTRAINT vita_ocr_pages_page_kind_check CHECK ((page_kind = ANY (ARRAY['scanned-text'::text, 'sparse-labels'::text, 'mixed'::text, 'unlabeled-plate'::text, 'unknown'::text]))),
    CONSTRAINT vita_ocr_pages_page_number_check CHECK ((page_number > 0)),
    CONSTRAINT vita_ocr_pages_page_width_pixels_check CHECK ((page_width_pixels > 0)),
    CONSTRAINT vita_ocr_pages_pipeline_version_check CHECK ((pipeline_version > 0)),
    CONSTRAINT vita_ocr_pages_review_status_check CHECK ((review_status = ANY (ARRAY['pending'::text, 'accepted'::text, 'needs_review'::text, 'rejected'::text]))),
    CONSTRAINT vita_ocr_pages_source_file_check CHECK (((char_length(source_file) >= 1) AND (char_length(source_file) <= 500))),
    CONSTRAINT vita_ocr_pages_source_image_sha256_check CHECK ((source_image_sha256 ~ '^[0-9a-f]{64}$'::text)),
    CONSTRAINT vita_ocr_pages_source_sha256_check CHECK ((source_sha256 ~ '^[0-9a-f]{64}$'::text)),
    CONSTRAINT vita_ocr_pages_total_word_count_check CHECK ((total_word_count >= 0)),
    CONSTRAINT vita_ocr_pages_word_boxes_check CHECK ((jsonb_typeof(word_boxes) = 'array'::text))
);


--
-- Name: TABLE vita_ocr_pages; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.vita_ocr_pages IS 'Estágio privado de OCR página a página, exclusivo da biblioteca dos tutores Aeternum Vita.';


--
-- Name: COLUMN vita_ocr_pages.word_boxes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vita_ocr_pages.word_boxes IS 'Palavras OCR auditáveis com confiança e caixas de posição; nunca expostas ao cliente.';


--
-- Name: COLUMN vita_ocr_pages.review_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vita_ocr_pages.review_status IS 'Somente páginas aceitas após os gates de qualidade podem ser promovidas ao corpus textual da Vita.';


--
-- Name: vita_tutor_memory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vita_tutor_memory (
    user_id uuid NOT NULL,
    tutor_id text NOT NULL,
    current_topic text,
    previous_topics text[] DEFAULT '{}'::text[] NOT NULL,
    mastery_evidence integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT vita_tutor_memory_current_topic_check CHECK ((char_length(current_topic) <= 160)),
    CONSTRAINT vita_tutor_memory_mastery_evidence_check CHECK ((mastery_evidence >= 0)),
    CONSTRAINT vita_tutor_memory_previous_topics_check CHECK ((cardinality(previous_topics) <= 5)),
    CONSTRAINT vita_tutor_memory_tutor_id_check CHECK ((tutor_id = ANY (ARRAY['eduardo'::text, 'antonia'::text, 'ariana'::text, 'fabian'::text])))
);


--
-- Name: TABLE vita_tutor_memory; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.vita_tutor_memory IS 'Bounded cross-session pedagogical memory owned exclusively by Aeternum Vita.';


--
-- Name: vita_voice_rate_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vita_voice_rate_limits (
    user_id uuid NOT NULL,
    window_started_at timestamp with time zone DEFAULT now() NOT NULL,
    request_count integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT vita_voice_rate_limits_request_count_check CHECK ((request_count >= 0))
);


--
-- Name: academic_class_students academic_class_students_class_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academic_class_students
    ADD CONSTRAINT academic_class_students_class_id_student_id_key UNIQUE (class_id, student_id);


--
-- Name: academic_class_students academic_class_students_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academic_class_students
    ADD CONSTRAINT academic_class_students_pkey PRIMARY KEY (id);


--
-- Name: academic_classes academic_classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academic_classes
    ADD CONSTRAINT academic_classes_pkey PRIMARY KEY (id);


--
-- Name: ai_audit_events ai_audit_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_audit_events
    ADD CONSTRAINT ai_audit_events_pkey PRIMARY KEY (id);


--
-- Name: ai_conversations ai_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_conversations
    ADD CONSTRAINT ai_conversations_pkey PRIMARY KEY (id);


--
-- Name: ai_messages ai_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_messages
    ADD CONSTRAINT ai_messages_pkey PRIMARY KEY (id);


--
-- Name: ai_rate_limits ai_rate_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_rate_limits
    ADD CONSTRAINT ai_rate_limits_pkey PRIMARY KEY (user_id);


--
-- Name: anatomical_knowledge_base anatomical_knowledge_base_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anatomical_knowledge_base
    ADD CONSTRAINT anatomical_knowledge_base_pkey PRIMARY KEY (id);


--
-- Name: anatomical_quiz_answers anatomical_quiz_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anatomical_quiz_answers
    ADD CONSTRAINT anatomical_quiz_answers_pkey PRIMARY KEY (id);


--
-- Name: anatomical_quiz_attempts anatomical_quiz_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anatomical_quiz_attempts
    ADD CONSTRAINT anatomical_quiz_attempts_pkey PRIMARY KEY (id);


--
-- Name: anatomical_quiz_questions anatomical_quiz_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anatomical_quiz_questions
    ADD CONSTRAINT anatomical_quiz_questions_pkey PRIMARY KEY (id);


--
-- Name: anatomical_quizzes anatomical_quizzes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anatomical_quizzes
    ADD CONSTRAINT anatomical_quizzes_pkey PRIMARY KEY (id);


--
-- Name: atlas_model_annotations atlas_model_annotations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_model_annotations
    ADD CONSTRAINT atlas_model_annotations_pkey PRIMARY KEY (id);


--
-- Name: atlas_model_assets atlas_model_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_model_assets
    ADD CONSTRAINT atlas_model_assets_pkey PRIMARY KEY (id);


--
-- Name: atlas_model_audit_logs atlas_model_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_model_audit_logs
    ADD CONSTRAINT atlas_model_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: atlas_models atlas_models_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_models
    ADD CONSTRAINT atlas_models_pkey PRIMARY KEY (id);


--
-- Name: atlas_models atlas_models_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_models
    ADD CONSTRAINT atlas_models_slug_key UNIQUE (slug);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: billing_cycles billing_cycles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_cycles
    ADD CONSTRAINT billing_cycles_pkey PRIMARY KEY (id);


--
-- Name: billing_snapshots billing_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_snapshots
    ADD CONSTRAINT billing_snapshots_pkey PRIMARY KEY (id);


--
-- Name: feature_flags feature_flags_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_name_key UNIQUE (name);


--
-- Name: feature_flags feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);


--
-- Name: institution_subscriptions institution_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institution_subscriptions
    ADD CONSTRAINT institution_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: institutions institutions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institutions
    ADD CONSTRAINT institutions_pkey PRIMARY KEY (id);


--
-- Name: institutions institutions_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institutions
    ADD CONSTRAINT institutions_slug_key UNIQUE (slug);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: legacy_cleanup_archive legacy_cleanup_archive_operation_key_source_table_source_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legacy_cleanup_archive
    ADD CONSTRAINT legacy_cleanup_archive_operation_key_source_table_source_id_key UNIQUE (operation_key, source_table, source_id);


--
-- Name: legacy_cleanup_archive legacy_cleanup_archive_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legacy_cleanup_archive
    ADD CONSTRAINT legacy_cleanup_archive_pkey PRIMARY KEY (id);


--
-- Name: license_usage license_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_usage
    ADD CONSTRAINT license_usage_pkey PRIMARY KEY (id);


--
-- Name: model_access_logs model_access_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_access_logs
    ADD CONSTRAINT model_access_logs_pkey PRIMARY KEY (id);


--
-- Name: model_annotations model_annotations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_annotations
    ADD CONSTRAINT model_annotations_pkey PRIMARY KEY (id);


--
-- Name: models_3d models_3d_institution_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.models_3d
    ADD CONSTRAINT models_3d_institution_id_slug_key UNIQUE (institution_id, slug);


--
-- Name: models_3d models_3d_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.models_3d
    ADD CONSTRAINT models_3d_pkey PRIMARY KEY (id);


--
-- Name: platform_events platform_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_events
    ADD CONSTRAINT platform_events_pkey PRIMARY KEY (id);


--
-- Name: security_events security_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT security_events_pkey PRIMARY KEY (id);


--
-- Name: student_profiles student_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT student_profiles_pkey PRIMARY KEY (user_id);


--
-- Name: study_agenda_events study_agenda_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_agenda_events
    ADD CONSTRAINT study_agenda_events_pkey PRIMARY KEY (id);


--
-- Name: study_agenda study_agenda_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_agenda
    ADD CONSTRAINT study_agenda_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_slug_key UNIQUE (slug);


--
-- Name: teacher_anatomical_notes teacher_anatomical_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_anatomical_notes
    ADD CONSTRAINT teacher_anatomical_notes_pkey PRIMARY KEY (id);


--
-- Name: teacher_lesson_plans teacher_lesson_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_lesson_plans
    ADD CONSTRAINT teacher_lesson_plans_pkey PRIMARY KEY (id);


--
-- Name: teacher_profiles teacher_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_profiles
    ADD CONSTRAINT teacher_profiles_pkey PRIMARY KEY (user_id);


--
-- Name: teacher_study_guides teacher_study_guides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_study_guides
    ADD CONSTRAINT teacher_study_guides_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: viewer_learning_events viewer_learning_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viewer_learning_events
    ADD CONSTRAINT viewer_learning_events_pkey PRIMARY KEY (id);


--
-- Name: viewer_learning_sessions viewer_learning_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viewer_learning_sessions
    ADD CONSTRAINT viewer_learning_sessions_pkey PRIMARY KEY (id);


--
-- Name: viewer_quiz_results viewer_quiz_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viewer_quiz_results
    ADD CONSTRAINT viewer_quiz_results_pkey PRIMARY KEY (id);


--
-- Name: vita_anatomical_knowledge vita_anatomical_knowledge_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vita_anatomical_knowledge
    ADD CONSTRAINT vita_anatomical_knowledge_pkey PRIMARY KEY (id);


--
-- Name: vita_anatomical_knowledge vita_anatomical_knowledge_source_sha256_page_number_chunk_i_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vita_anatomical_knowledge
    ADD CONSTRAINT vita_anatomical_knowledge_source_sha256_page_number_chunk_i_key UNIQUE (source_sha256, page_number, chunk_index);


--
-- Name: vita_ocr_pages vita_ocr_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vita_ocr_pages
    ADD CONSTRAINT vita_ocr_pages_pkey PRIMARY KEY (id);


--
-- Name: vita_ocr_pages vita_ocr_pages_source_sha256_page_number_pipeline_version_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vita_ocr_pages
    ADD CONSTRAINT vita_ocr_pages_source_sha256_page_number_pipeline_version_key UNIQUE (source_sha256, page_number, pipeline_version);


--
-- Name: vita_tutor_memory vita_tutor_memory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vita_tutor_memory
    ADD CONSTRAINT vita_tutor_memory_pkey PRIMARY KEY (user_id, tutor_id);


--
-- Name: vita_voice_rate_limits vita_voice_rate_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vita_voice_rate_limits
    ADD CONSTRAINT vita_voice_rate_limits_pkey PRIMARY KEY (user_id);


--
-- Name: ai_audit_events_conversation_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_audit_events_conversation_idx ON public.ai_audit_events USING btree (conversation_id);


--
-- Name: ai_audit_events_user_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_audit_events_user_created_idx ON public.ai_audit_events USING btree (user_id, created_at DESC);


--
-- Name: ai_conversations_user_updated_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_conversations_user_updated_idx ON public.ai_conversations USING btree (user_id, updated_at DESC);


--
-- Name: ai_messages_conversation_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_messages_conversation_created_idx ON public.ai_messages USING btree (conversation_id, created_at);


--
-- Name: ai_messages_user_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_messages_user_created_idx ON public.ai_messages USING btree (user_id, created_at DESC);


--
-- Name: anatomical_knowledge_book_chunk_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX anatomical_knowledge_book_chunk_uidx ON public.anatomical_knowledge_base USING btree (book_title, chunk_index);


--
-- Name: anatomical_knowledge_book_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX anatomical_knowledge_book_idx ON public.anatomical_knowledge_base USING btree (book_title);


--
-- Name: anatomical_knowledge_embedding_hnsw_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX anatomical_knowledge_embedding_hnsw_idx ON public.anatomical_knowledge_base USING hnsw (embedding extensions.vector_cosine_ops);


--
-- Name: idx_study_agenda_shared; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_study_agenda_shared ON public.study_agenda_events USING btree (institution_id, date) WHERE is_shared_with_students;


--
-- Name: idx_study_agenda_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_study_agenda_user_date ON public.study_agenda_events USING btree (user_id, date, start_time);


--
-- Name: viewer_learning_events_model_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX viewer_learning_events_model_type_idx ON public.viewer_learning_events USING btree (model_id, event_type, created_at DESC);


--
-- Name: viewer_learning_events_user_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX viewer_learning_events_user_created_idx ON public.viewer_learning_events USING btree (user_id, created_at DESC);


--
-- Name: viewer_learning_sessions_client_session_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX viewer_learning_sessions_client_session_uidx ON public.viewer_learning_sessions USING btree (client_session_id) WHERE (client_session_id IS NOT NULL);


--
-- Name: viewer_learning_sessions_user_model_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX viewer_learning_sessions_user_model_idx ON public.viewer_learning_sessions USING btree (user_id, model_id, session_start DESC);


--
-- Name: viewer_learning_sessions_user_start_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX viewer_learning_sessions_user_start_idx ON public.viewer_learning_sessions USING btree (user_id, session_start DESC);


--
-- Name: viewer_quiz_results_user_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX viewer_quiz_results_user_created_idx ON public.viewer_quiz_results USING btree (user_id, created_at DESC);


--
-- Name: viewer_quiz_results_user_model_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX viewer_quiz_results_user_model_idx ON public.viewer_quiz_results USING btree (user_id, model_id, created_at DESC);


--
-- Name: vita_anatomical_knowledge_book_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vita_anatomical_knowledge_book_idx ON public.vita_anatomical_knowledge USING btree (book_title);


--
-- Name: vita_anatomical_knowledge_lexical_gin_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vita_anatomical_knowledge_lexical_gin_idx ON public.vita_anatomical_knowledge USING gin (to_tsvector('simple'::regconfig, ((COALESCE(book_title, ''::text) || ' '::text) || COALESCE(content, ''::text))));


--
-- Name: vita_anatomical_knowledge_source_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vita_anatomical_knowledge_source_idx ON public.vita_anatomical_knowledge USING btree (source_sha256);


--
-- Name: vita_ocr_pages_review_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vita_ocr_pages_review_idx ON public.vita_ocr_pages USING btree (review_status, mean_confidence DESC);


--
-- Name: vita_ocr_pages_source_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vita_ocr_pages_source_idx ON public.vita_ocr_pages USING btree (source_sha256, page_number);


--
-- Name: viewer_learning_events enforce_viewer_learning_event_identity; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER enforce_viewer_learning_event_identity BEFORE INSERT OR UPDATE ON public.viewer_learning_events FOR EACH ROW EXECUTE FUNCTION public.enforce_learning_identity();


--
-- Name: viewer_learning_sessions enforce_viewer_learning_session_identity; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER enforce_viewer_learning_session_identity BEFORE INSERT OR UPDATE ON public.viewer_learning_sessions FOR EACH ROW EXECUTE FUNCTION public.enforce_learning_identity();


--
-- Name: viewer_quiz_results enforce_viewer_quiz_result_identity; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER enforce_viewer_quiz_result_identity BEFORE INSERT OR UPDATE ON public.viewer_quiz_results FOR EACH ROW EXECUTE FUNCTION public.enforce_learning_identity();


--
-- Name: study_agenda_events study_agenda_identity_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER study_agenda_identity_trigger BEFORE INSERT OR UPDATE ON public.study_agenda_events FOR EACH ROW EXECUTE FUNCTION public.enforce_study_agenda_identity();


--
-- Name: academic_class_students academic_class_students_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academic_class_students
    ADD CONSTRAINT academic_class_students_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.academic_classes(id) ON DELETE RESTRICT;


--
-- Name: academic_class_students academic_class_students_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academic_class_students
    ADD CONSTRAINT academic_class_students_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE RESTRICT;


--
-- Name: academic_class_students academic_class_students_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academic_class_students
    ADD CONSTRAINT academic_class_students_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: academic_classes academic_classes_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academic_classes
    ADD CONSTRAINT academic_classes_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE RESTRICT;


--
-- Name: academic_classes academic_classes_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academic_classes
    ADD CONSTRAINT academic_classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: ai_audit_events ai_audit_events_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_audit_events
    ADD CONSTRAINT ai_audit_events_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.ai_conversations(id) ON DELETE SET NULL;


--
-- Name: ai_audit_events ai_audit_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_audit_events
    ADD CONSTRAINT ai_audit_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: ai_conversations ai_conversations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_conversations
    ADD CONSTRAINT ai_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ai_messages ai_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_messages
    ADD CONSTRAINT ai_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.ai_conversations(id) ON DELETE CASCADE;


--
-- Name: ai_messages ai_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_messages
    ADD CONSTRAINT ai_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ai_rate_limits ai_rate_limits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_rate_limits
    ADD CONSTRAINT ai_rate_limits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: anatomical_quiz_answers anatomical_quiz_answers_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anatomical_quiz_answers
    ADD CONSTRAINT anatomical_quiz_answers_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.anatomical_quiz_attempts(id) ON DELETE CASCADE;


--
-- Name: anatomical_quiz_answers anatomical_quiz_answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anatomical_quiz_answers
    ADD CONSTRAINT anatomical_quiz_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.anatomical_quiz_questions(id) ON DELETE CASCADE;


--
-- Name: anatomical_quiz_attempts anatomical_quiz_attempts_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anatomical_quiz_attempts
    ADD CONSTRAINT anatomical_quiz_attempts_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.anatomical_quizzes(id) ON DELETE CASCADE;


--
-- Name: anatomical_quiz_attempts anatomical_quiz_attempts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anatomical_quiz_attempts
    ADD CONSTRAINT anatomical_quiz_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: anatomical_quiz_questions anatomical_quiz_questions_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anatomical_quiz_questions
    ADD CONSTRAINT anatomical_quiz_questions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.anatomical_quizzes(id) ON DELETE CASCADE;


--
-- Name: anatomical_quizzes anatomical_quizzes_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anatomical_quizzes
    ADD CONSTRAINT anatomical_quizzes_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE CASCADE;


--
-- Name: atlas_model_annotations atlas_model_annotations_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_model_annotations
    ADD CONSTRAINT atlas_model_annotations_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.atlas_models(id) ON DELETE CASCADE;


--
-- Name: atlas_model_assets atlas_model_assets_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_model_assets
    ADD CONSTRAINT atlas_model_assets_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.atlas_models(id) ON DELETE CASCADE;


--
-- Name: atlas_model_audit_logs atlas_model_audit_logs_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_model_audit_logs
    ADD CONSTRAINT atlas_model_audit_logs_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.atlas_models(id) ON DELETE CASCADE;


--
-- Name: atlas_model_audit_logs atlas_model_audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_model_audit_logs
    ADD CONSTRAINT atlas_model_audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: billing_cycles billing_cycles_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_cycles
    ADD CONSTRAINT billing_cycles_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.institution_subscriptions(id) ON DELETE CASCADE;


--
-- Name: billing_snapshots billing_snapshots_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_snapshots
    ADD CONSTRAINT billing_snapshots_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.billing_cycles(id) ON DELETE SET NULL;


--
-- Name: billing_snapshots billing_snapshots_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_snapshots
    ADD CONSTRAINT billing_snapshots_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE CASCADE;


--
-- Name: institution_subscriptions institution_subscriptions_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institution_subscriptions
    ADD CONSTRAINT institution_subscriptions_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE CASCADE;


--
-- Name: institution_subscriptions institution_subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institution_subscriptions
    ADD CONSTRAINT institution_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id) ON DELETE RESTRICT;


--
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.billing_cycles(id) ON DELETE SET NULL;


--
-- Name: invoices invoices_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE CASCADE;


--
-- Name: license_usage license_usage_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_usage
    ADD CONSTRAINT license_usage_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE CASCADE;


--
-- Name: model_access_logs model_access_logs_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_access_logs
    ADD CONSTRAINT model_access_logs_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE CASCADE;


--
-- Name: model_access_logs model_access_logs_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_access_logs
    ADD CONSTRAINT model_access_logs_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.models_3d(id) ON DELETE CASCADE;


--
-- Name: model_access_logs model_access_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_access_logs
    ADD CONSTRAINT model_access_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: model_annotations model_annotations_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_annotations
    ADD CONSTRAINT model_annotations_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE CASCADE;


--
-- Name: model_annotations model_annotations_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_annotations
    ADD CONSTRAINT model_annotations_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.models_3d(id) ON DELETE CASCADE;


--
-- Name: models_3d models_3d_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.models_3d
    ADD CONSTRAINT models_3d_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE CASCADE;


--
-- Name: platform_events platform_events_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_events
    ADD CONSTRAINT platform_events_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE CASCADE;


--
-- Name: platform_events platform_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_events
    ADD CONSTRAINT platform_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: security_events security_events_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT security_events_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE CASCADE;


--
-- Name: security_events security_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT security_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: student_profiles student_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT student_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: study_agenda_events study_agenda_events_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_agenda_events
    ADD CONSTRAINT study_agenda_events_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE CASCADE;


--
-- Name: study_agenda_events study_agenda_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_agenda_events
    ADD CONSTRAINT study_agenda_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: study_agenda study_agenda_linked_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_agenda
    ADD CONSTRAINT study_agenda_linked_model_id_fkey FOREIGN KEY (linked_model_id) REFERENCES public.models_3d(id) ON DELETE SET NULL;


--
-- Name: study_agenda study_agenda_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_agenda
    ADD CONSTRAINT study_agenda_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: teacher_anatomical_notes teacher_anatomical_notes_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_anatomical_notes
    ADD CONSTRAINT teacher_anatomical_notes_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE RESTRICT;


--
-- Name: teacher_anatomical_notes teacher_anatomical_notes_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_anatomical_notes
    ADD CONSTRAINT teacher_anatomical_notes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: teacher_lesson_plans teacher_lesson_plans_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_lesson_plans
    ADD CONSTRAINT teacher_lesson_plans_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.academic_classes(id) ON DELETE SET NULL;


--
-- Name: teacher_lesson_plans teacher_lesson_plans_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_lesson_plans
    ADD CONSTRAINT teacher_lesson_plans_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE RESTRICT;


--
-- Name: teacher_lesson_plans teacher_lesson_plans_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_lesson_plans
    ADD CONSTRAINT teacher_lesson_plans_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: teacher_profiles teacher_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_profiles
    ADD CONSTRAINT teacher_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: teacher_study_guides teacher_study_guides_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_study_guides
    ADD CONSTRAINT teacher_study_guides_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.academic_classes(id) ON DELETE SET NULL;


--
-- Name: teacher_study_guides teacher_study_guides_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_study_guides
    ADD CONSTRAINT teacher_study_guides_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE RESTRICT;


--
-- Name: teacher_study_guides teacher_study_guides_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_study_guides
    ADD CONSTRAINT teacher_study_guides_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: users users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: users users_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE SET NULL;


--
-- Name: viewer_learning_events viewer_learning_events_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viewer_learning_events
    ADD CONSTRAINT viewer_learning_events_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.viewer_learning_sessions(id) ON DELETE CASCADE;


--
-- Name: viewer_learning_events viewer_learning_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viewer_learning_events
    ADD CONSTRAINT viewer_learning_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: viewer_learning_sessions viewer_learning_sessions_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viewer_learning_sessions
    ADD CONSTRAINT viewer_learning_sessions_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE CASCADE;


--
-- Name: viewer_learning_sessions viewer_learning_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viewer_learning_sessions
    ADD CONSTRAINT viewer_learning_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: viewer_quiz_results viewer_quiz_results_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viewer_quiz_results
    ADD CONSTRAINT viewer_quiz_results_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE CASCADE;


--
-- Name: viewer_quiz_results viewer_quiz_results_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viewer_quiz_results
    ADD CONSTRAINT viewer_quiz_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: vita_tutor_memory vita_tutor_memory_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vita_tutor_memory
    ADD CONSTRAINT vita_tutor_memory_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: vita_voice_rate_limits vita_voice_rate_limits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vita_voice_rate_limits
    ADD CONSTRAINT vita_voice_rate_limits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: viewer_learning_events Institution staff can view learning events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Institution staff can view learning events" ON public.viewer_learning_events FOR SELECT TO authenticated USING (((public.current_user_role() = ANY (ARRAY['super_admin'::text, 'admin'::text, 'institution_admin'::text, 'reitor'::text, 'rector'::text, 'coordenador'::text, 'coordinator'::text, 'professor'::text, 'teacher'::text])) AND ((public.current_user_role() = 'super_admin'::text) OR (institution_id = public.current_user_institution_id()))));


--
-- Name: viewer_learning_sessions Institution staff can view learning sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Institution staff can view learning sessions" ON public.viewer_learning_sessions FOR SELECT TO authenticated USING (((public.current_user_role() = ANY (ARRAY['super_admin'::text, 'admin'::text, 'institution_admin'::text, 'reitor'::text, 'rector'::text, 'coordenador'::text, 'coordinator'::text, 'professor'::text, 'teacher'::text])) AND ((public.current_user_role() = 'super_admin'::text) OR (institution_id = public.current_user_institution_id()))));


--
-- Name: viewer_quiz_results Institution staff can view quiz results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Institution staff can view quiz results" ON public.viewer_quiz_results FOR SELECT TO authenticated USING (((public.current_user_role() = ANY (ARRAY['super_admin'::text, 'admin'::text, 'institution_admin'::text, 'reitor'::text, 'rector'::text, 'coordenador'::text, 'coordinator'::text, 'professor'::text, 'teacher'::text])) AND ((public.current_user_role() = 'super_admin'::text) OR (institution_id = public.current_user_institution_id()))));


--
-- Name: study_agenda_events Users can create own agenda events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own agenda events" ON public.study_agenda_events FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: study_agenda_events Users can delete own agenda events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own agenda events" ON public.study_agenda_events FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: viewer_learning_events Users can insert their own learning events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own learning events" ON public.viewer_learning_events FOR INSERT TO authenticated WITH CHECK (((auth.uid() = user_id) AND ((session_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.viewer_learning_sessions session
  WHERE ((session.id = viewer_learning_events.session_id) AND (session.user_id = auth.uid())))))));


--
-- Name: viewer_learning_sessions Users can insert their own learning sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own learning sessions" ON public.viewer_learning_sessions FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: viewer_quiz_results Users can insert their own quiz results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own quiz results" ON public.viewer_quiz_results FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: study_agenda_events Users can update own agenda events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own agenda events" ON public.study_agenda_events FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: viewer_learning_sessions Users can update their own learning sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own learning sessions" ON public.viewer_learning_sessions FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: viewer_quiz_results Users can update their own quiz results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own quiz results" ON public.viewer_quiz_results FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: study_agenda_events Users can view own or shared institution agenda events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own or shared institution agenda events" ON public.study_agenda_events FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR (is_shared_with_students AND (institution_id = ( SELECT profile.institution_id
   FROM public.users profile
  WHERE (profile.id = auth.uid()))))));


--
-- Name: viewer_learning_events Users can view their own learning events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own learning events" ON public.viewer_learning_events FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: viewer_learning_sessions Users can view their own learning sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own learning sessions" ON public.viewer_learning_sessions FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: viewer_quiz_results Users can view their own quiz results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own quiz results" ON public.viewer_quiz_results FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: ai_messages Users insert their own AI messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users insert their own AI messages" ON public.ai_messages FOR INSERT TO authenticated WITH CHECK (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM public.ai_conversations conversation
  WHERE ((conversation.id = ai_messages.conversation_id) AND (conversation.user_id = auth.uid()))))));


--
-- Name: ai_conversations Users manage their own AI conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage their own AI conversations" ON public.ai_conversations TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: ai_audit_events Users view their own AI audit trail; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view their own AI audit trail" ON public.ai_audit_events FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: ai_messages Users view their own AI messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view their own AI messages" ON public.ai_messages FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: academic_class_students; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.academic_class_students ENABLE ROW LEVEL SECURITY;

--
-- Name: academic_classes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.academic_classes ENABLE ROW LEVEL SECURITY;

--
-- Name: academic_classes academic_classes_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY academic_classes_select ON public.academic_classes FOR SELECT TO authenticated USING (((public.current_user_role() = 'super_admin'::text) OR ((institution_id = public.current_user_institution_id()) AND ((teacher_id = auth.uid()) OR (public.current_user_role() = 'institution_admin'::text)))));


--
-- Name: ai_audit_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_audit_events ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_rate_limits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;

--
-- Name: anatomical_knowledge_base; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.anatomical_knowledge_base ENABLE ROW LEVEL SECURITY;

--
-- Name: anatomical_quiz_answers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.anatomical_quiz_answers ENABLE ROW LEVEL SECURITY;

--
-- Name: anatomical_quiz_attempts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.anatomical_quiz_attempts ENABLE ROW LEVEL SECURITY;

--
-- Name: anatomical_quiz_questions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.anatomical_quiz_questions ENABLE ROW LEVEL SECURITY;

--
-- Name: anatomical_quizzes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.anatomical_quizzes ENABLE ROW LEVEL SECURITY;

--
-- Name: atlas_model_annotations atlas_annotations_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY atlas_annotations_admin_all ON public.atlas_model_annotations TO authenticated USING ((public.current_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]))) WITH CHECK ((public.current_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text])));


--
-- Name: atlas_model_annotations atlas_annotations_read_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY atlas_annotations_read_policy ON public.atlas_model_annotations FOR SELECT TO authenticated USING (public.can_read_atlas_model(model_id));


--
-- Name: atlas_model_assets atlas_assets_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY atlas_assets_admin_all ON public.atlas_model_assets TO authenticated USING ((public.current_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]))) WITH CHECK ((public.current_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text])));


--
-- Name: atlas_model_assets atlas_assets_read_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY atlas_assets_read_policy ON public.atlas_model_assets FOR SELECT TO authenticated USING (public.can_read_atlas_model(model_id));


--
-- Name: atlas_model_annotations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.atlas_model_annotations ENABLE ROW LEVEL SECURITY;

--
-- Name: atlas_model_assets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.atlas_model_assets ENABLE ROW LEVEL SECURITY;

--
-- Name: atlas_model_audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.atlas_model_audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: atlas_models; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.atlas_models ENABLE ROW LEVEL SECURITY;

--
-- Name: atlas_models atlas_models_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY atlas_models_admin_all ON public.atlas_models TO authenticated USING ((public.current_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]))) WITH CHECK ((public.current_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text])));


--
-- Name: atlas_models atlas_models_read_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY atlas_models_read_policy ON public.atlas_models FOR SELECT TO authenticated USING (public.can_read_atlas_model(id));


--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: billing_cycles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.billing_cycles ENABLE ROW LEVEL SECURITY;

--
-- Name: billing_snapshots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.billing_snapshots ENABLE ROW LEVEL SECURITY;

--
-- Name: feature_flags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

--
-- Name: feature_flags feature_flags_read_authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY feature_flags_read_authenticated ON public.feature_flags FOR SELECT TO authenticated USING (true);


--
-- Name: institution_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.institution_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: institutions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

--
-- Name: institutions institutions_read_authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY institutions_read_authenticated ON public.institutions FOR SELECT TO authenticated USING (true);


--
-- Name: invoice_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: legacy_cleanup_archive; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.legacy_cleanup_archive ENABLE ROW LEVEL SECURITY;

--
-- Name: license_usage; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.license_usage ENABLE ROW LEVEL SECURITY;

--
-- Name: model_access_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.model_access_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: model_annotations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.model_annotations ENABLE ROW LEVEL SECURITY;

--
-- Name: models_3d; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.models_3d ENABLE ROW LEVEL SECURITY;

--
-- Name: models_3d models_3d_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY models_3d_select ON public.models_3d FOR SELECT TO authenticated USING (((status = 'available'::text) OR (public.current_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]))));


--
-- Name: platform_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.platform_events ENABLE ROW LEVEL SECURITY;

--
-- Name: security_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

--
-- Name: viewer_learning_sessions staff_read_institution_sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY staff_read_institution_sessions ON public.viewer_learning_sessions FOR SELECT TO authenticated USING (((public.current_user_role() = 'super_admin'::text) OR ((institution_id = public.current_user_institution_id()) AND (public.current_user_role() = ANY (ARRAY['admin'::text, 'institution_admin'::text, 'rector'::text, 'coordinator'::text, 'teacher'::text])))));


--
-- Name: student_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: study_agenda; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.study_agenda ENABLE ROW LEVEL SECURITY;

--
-- Name: study_agenda study_agenda_all_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY study_agenda_all_own ON public.study_agenda TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: study_agenda_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.study_agenda_events ENABLE ROW LEVEL SECURITY;

--
-- Name: study_agenda study_agenda_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY study_agenda_select ON public.study_agenda FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR (public.current_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]))));


--
-- Name: subscription_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: teacher_anatomical_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.teacher_anatomical_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: teacher_lesson_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.teacher_lesson_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: teacher_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: teacher_study_guides; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.teacher_study_guides ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: viewer_learning_events users_manage_own_events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_manage_own_events ON public.viewer_learning_events TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.viewer_learning_sessions s
  WHERE ((s.id = viewer_learning_events.session_id) AND (s.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.viewer_learning_sessions s
  WHERE ((s.id = viewer_learning_events.session_id) AND (s.user_id = auth.uid())))));


--
-- Name: viewer_quiz_results users_manage_own_quiz_results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_manage_own_quiz_results ON public.viewer_quiz_results TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: viewer_learning_sessions users_manage_own_sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_manage_own_sessions ON public.viewer_learning_sessions TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: users users_read_own_or_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_read_own_or_admin ON public.users FOR SELECT TO authenticated USING (((id = auth.uid()) OR (public.current_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]))));


--
-- Name: viewer_learning_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.viewer_learning_events ENABLE ROW LEVEL SECURITY;

--
-- Name: viewer_learning_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.viewer_learning_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: viewer_quiz_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.viewer_quiz_results ENABLE ROW LEVEL SECURITY;

--
-- Name: vita_anatomical_knowledge; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vita_anatomical_knowledge ENABLE ROW LEVEL SECURITY;

--
-- Name: vita_tutor_memory vita_memory_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY vita_memory_select_own ON public.vita_tutor_memory FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: vita_ocr_pages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vita_ocr_pages ENABLE ROW LEVEL SECURITY;

--
-- Name: vita_tutor_memory; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vita_tutor_memory ENABLE ROW LEVEL SECURITY;

--
-- Name: vita_voice_rate_limits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vita_voice_rate_limits ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict UVDFKHz07B4BL7qYZi1jwSFJ6uJB7nPynSlB8bWJhxv6Tv8Gng3FIgGD6A16jZN

