


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


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."award_course_credits"("p_user_id" "uuid", "p_course_id" bigint, "p_credit_type" "text", "p_amount" numeric) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_ledger_id UUID;
BEGIN
    -- Check if already awarded
    SELECT id INTO v_ledger_id
    FROM public.user_credits_ledger
    WHERE user_id = p_user_id 
      AND course_id = p_course_id 
      AND credit_type = p_credit_type;

    IF v_ledger_id IS NOT NULL THEN
        RETURN v_ledger_id; -- Already exists
    END IF;

    -- Insert
    INSERT INTO public.user_credits_ledger (user_id, course_id, credit_type, amount)
    VALUES (p_user_id, p_course_id, p_credit_type, p_amount)
    RETURNING id INTO v_ledger_id;

    RETURN v_ledger_id;
END;
$$;


ALTER FUNCTION "public"."award_course_credits"("p_user_id" "uuid", "p_course_id" bigint, "p_credit_type" "text", "p_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_monthly_payout_report"("report_month" "date") RETURNS TABLE("author_name" "text", "course_title" "text", "watch_time_minutes" numeric, "ai_citations" bigint, "total_payout_score" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
BEGIN
  RETURN QUERY
  WITH monthly_watch_time AS (
    SELECT 
      c.author_id,
      c.id as course_id,
      SUM(up.view_time_seconds) / 60.0 as minutes
    FROM public.user_progress up
    JOIN public.courses c ON up.course_id = c.id
    WHERE date_trunc('month', up.last_accessed) = date_trunc('month', report_month)
    GROUP BY c.author_id, c.id
  ),
  monthly_citations AS (
    SELECT 
      author_id,
      course_id,
      COUNT(*) as citations
    FROM public.ai_content_citations
    WHERE date_trunc('month', created_at) = date_trunc('month', report_month)
    GROUP BY author_id, course_id
  )
  SELECT 
    p.full_name as author_name,
    c.title as course_title,
    COALESCE(wt.minutes, 0) as watch_time_minutes,
    COALESCE(mc.citations, 0) as ai_citations,
    (COALESCE(wt.minutes, 0) * 0.10) + (COALESCE(mc.citations, 0) * 0.50) as total_payout_score -- Mock formula: $0.10/min + $0.50/citation
  FROM public.courses c
  JOIN public.profiles p ON c.author_id = p.id
  LEFT JOIN monthly_watch_time wt ON c.id = wt.course_id
  LEFT JOIN monthly_citations mc ON c.id = mc.course_id
  WHERE p.author_status = 'approved';
END;
$_$;


ALTER FUNCTION "public"."get_monthly_payout_report"("report_month" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_trial_minutes"("p_user_id" "uuid", "p_minutes" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.profiles
    SET trial_minutes_used = COALESCE(trial_minutes_used, 0) + p_minutes
    WHERE id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."increment_trial_minutes"("p_user_id" "uuid", "p_minutes" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_course_embeddings"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "filter_course_id" bigint DEFAULT NULL::bigint) RETURNS TABLE("id" "uuid", "course_id" bigint, "content" "text", "similarity" double precision, "metadata" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
begin
  return query
  select
    course_embeddings.id,
    course_embeddings.course_id,
    course_embeddings.content,
    1 - (course_embeddings.embedding <=> query_embedding) as similarity,
    course_embeddings.metadata
  from course_embeddings
  where 1 - (course_embeddings.embedding <=> query_embedding) > match_threshold
  and (filter_course_id is null or course_embeddings.course_id = filter_course_id)
  order by course_embeddings.embedding <=> query_embedding
  limit match_count;
end;
$$;


ALTER FUNCTION "public"."match_course_embeddings"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "filter_course_id" bigint) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ai_attribution_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "course_id" bigint,
    "query" "text" NOT NULL,
    "response" "text",
    "sources" "jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."ai_attribution_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_content_citations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "course_id" bigint NOT NULL,
    "author_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "citation_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."ai_content_citations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_system_prompts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "agent_type" "text" NOT NULL,
    "system_instruction" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."ai_system_prompts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."certificates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "course_id" bigint NOT NULL,
    "issued_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."certificates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."collection_items" (
    "collection_id" "uuid" NOT NULL,
    "course_id" bigint,
    "added_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "item_type" "text" NOT NULL,
    "item_id" "text" NOT NULL
);


ALTER TABLE "public"."collection_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."context_embeddings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "item_type" "text" NOT NULL,
    "item_id" "text" NOT NULL,
    "content" "text" NOT NULL,
    "embedding" "public"."vector"(768),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."context_embeddings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."course_embeddings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "course_id" bigint NOT NULL,
    "lesson_id" "uuid",
    "content" "text" NOT NULL,
    "embedding" "public"."vector"(768),
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."course_embeddings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."course_ratings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "course_id" bigint NOT NULL,
    "rating" integer NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "course_ratings_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."course_ratings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."courses" (
    "id" bigint NOT NULL,
    "title" "text" NOT NULL,
    "author" "text" NOT NULL,
    "category" "text" NOT NULL,
    "description" "text",
    "image_url" "text",
    "duration" "text",
    "rating" numeric(3,2) DEFAULT 0.0,
    "badges" "text"[],
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "is_saved" boolean DEFAULT false,
    "status" "text" DEFAULT 'draft'::"text",
    "collections" "text"[] DEFAULT '{}'::"text"[]
);


ALTER TABLE "public"."courses" OWNER TO "postgres";


ALTER TABLE "public"."courses" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."courses_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."lessons" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "module_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "order" integer NOT NULL,
    "duration" "text",
    "type" "text" DEFAULT 'video'::"text",
    "video_url" "text",
    "content" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "quiz_data" "jsonb"
);


ALTER TABLE "public"."lessons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."modules" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "course_id" bigint NOT NULL,
    "title" "text" NOT NULL,
    "order" integer NOT NULL,
    "duration" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."modules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "invite_hash" "text" NOT NULL,
    "stripe_customer_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "role" "text" DEFAULT 'user'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "trial_minutes_used" integer DEFAULT 0,
    "org_id" "uuid",
    "membership_status" "text" DEFAULT 'trial'::"text",
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "stripe_price_id" "text",
    "billing_period_end" timestamp with time zone,
    "author_status" "text" DEFAULT 'none'::"text",
    "author_bio" "text",
    "linkedin_url" "text",
    CONSTRAINT "profiles_author_status_check" CHECK (("author_status" = ANY (ARRAY['none'::"text", 'pending'::"text", 'approved'::"text", 'rejected'::"text"]))),
    CONSTRAINT "profiles_membership_status_check" CHECK (("membership_status" = ANY (ARRAY['trial'::"text", 'active'::"text", 'inactive'::"text", 'employee'::"text", 'org_admin'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prompt_suggestions" (
    "id" bigint NOT NULL,
    "page_context" "text" NOT NULL,
    "label" "text" NOT NULL,
    "prompt" "text" NOT NULL,
    "category" "text",
    "order_index" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "prompt_suggestions_page_context_check" CHECK (("page_context" = ANY (ARRAY['user_dashboard'::"text", 'employee_dashboard'::"text", 'org_admin_dashboard'::"text", 'instructor_dashboard'::"text"])))
);


ALTER TABLE "public"."prompt_suggestions" OWNER TO "postgres";


ALTER TABLE "public"."prompt_suggestions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."prompt_suggestions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."resources" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "course_id" bigint NOT NULL,
    "title" "text" NOT NULL,
    "type" "text" NOT NULL,
    "url" "text" NOT NULL,
    "size" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."resources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_ai_memory" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "insight_type" "text" NOT NULL,
    "content" "text" NOT NULL,
    "confidence_score" numeric DEFAULT 1.0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."user_ai_memory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_assessment_attempts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "lesson_id" "uuid" NOT NULL,
    "score" numeric(5,2) NOT NULL,
    "responses" "jsonb" NOT NULL,
    "passed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."user_assessment_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_collections" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "label" "text" NOT NULL,
    "color" "text" NOT NULL,
    "is_custom" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "org_id" "uuid",
    "is_org_collection" boolean DEFAULT false
);


ALTER TABLE "public"."user_collections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_credits_ledger" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "course_id" bigint,
    "credit_type" "text" NOT NULL,
    "amount" numeric(4,2) NOT NULL,
    "awarded_at" timestamp with time zone DEFAULT "now"(),
    "certificate_id" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "user_credits_ledger_credit_type_check" CHECK (("credit_type" = ANY (ARRAY['SHRM'::"text", 'HRCI'::"text"])))
);


ALTER TABLE "public"."user_credits_ledger" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_progress" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "course_id" bigint NOT NULL,
    "lesson_id" "uuid",
    "is_completed" boolean DEFAULT false,
    "last_accessed" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "view_time_seconds" integer DEFAULT 0
);


ALTER TABLE "public"."user_progress" OWNER TO "postgres";


ALTER TABLE ONLY "public"."ai_attribution_logs"
    ADD CONSTRAINT "ai_attribution_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_content_citations"
    ADD CONSTRAINT "ai_content_citations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_system_prompts"
    ADD CONSTRAINT "ai_system_prompts_agent_type_key" UNIQUE ("agent_type");



ALTER TABLE ONLY "public"."ai_system_prompts"
    ADD CONSTRAINT "ai_system_prompts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "certificates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "certificates_user_id_course_id_key" UNIQUE ("user_id", "course_id");



ALTER TABLE ONLY "public"."collection_items"
    ADD CONSTRAINT "collection_items_pkey" PRIMARY KEY ("collection_id", "item_type", "item_id");



ALTER TABLE ONLY "public"."context_embeddings"
    ADD CONSTRAINT "context_embeddings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."course_embeddings"
    ADD CONSTRAINT "course_embeddings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."course_ratings"
    ADD CONSTRAINT "course_ratings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."course_ratings"
    ADD CONSTRAINT "course_ratings_user_id_course_id_key" UNIQUE ("user_id", "course_id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "modules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prompt_suggestions"
    ADD CONSTRAINT "prompt_suggestions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_ai_memory"
    ADD CONSTRAINT "user_ai_memory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_assessment_attempts"
    ADD CONSTRAINT "user_assessment_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_collections"
    ADD CONSTRAINT "user_collections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_credits_ledger"
    ADD CONSTRAINT "user_credits_ledger_certificate_id_key" UNIQUE ("certificate_id");



ALTER TABLE ONLY "public"."user_credits_ledger"
    ADD CONSTRAINT "user_credits_ledger_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_user_id_lesson_id_key" UNIQUE ("user_id", "lesson_id");



CREATE INDEX "context_embeddings_embedding_idx" ON "public"."context_embeddings" USING "ivfflat" ("embedding" "public"."vector_cosine_ops") WITH ("lists"='100');



CREATE INDEX "idx_ai_citations_author_date" ON "public"."ai_content_citations" USING "btree" ("author_id", "created_at");



CREATE INDEX "idx_profiles_author_status" ON "public"."profiles" USING "btree" ("author_status");



CREATE INDEX "idx_profiles_stripe_customer_id" ON "public"."profiles" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_user_ai_memory_user" ON "public"."user_ai_memory" USING "btree" ("user_id");



CREATE INDEX "idx_user_progress_view_time" ON "public"."user_progress" USING "btree" ("view_time_seconds");



ALTER TABLE ONLY "public"."ai_attribution_logs"
    ADD CONSTRAINT "ai_attribution_logs_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_attribution_logs"
    ADD CONSTRAINT "ai_attribution_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_content_citations"
    ADD CONSTRAINT "ai_content_citations_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ai_content_citations"
    ADD CONSTRAINT "ai_content_citations_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_content_citations"
    ADD CONSTRAINT "ai_content_citations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "certificates_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "certificates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collection_items"
    ADD CONSTRAINT "collection_items_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "public"."user_collections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collection_items"
    ADD CONSTRAINT "collection_items_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."course_embeddings"
    ADD CONSTRAINT "course_embeddings_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."course_embeddings"
    ADD CONSTRAINT "course_embeddings_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."course_ratings"
    ADD CONSTRAINT "course_ratings_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."course_ratings"
    ADD CONSTRAINT "course_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "modules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_ai_memory"
    ADD CONSTRAINT "user_ai_memory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_assessment_attempts"
    ADD CONSTRAINT "user_assessment_attempts_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_assessment_attempts"
    ADD CONSTRAINT "user_assessment_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_collections"
    ADD CONSTRAINT "user_collections_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_collections"
    ADD CONSTRAINT "user_collections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_credits_ledger"
    ADD CONSTRAINT "user_credits_ledger_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_credits_ledger"
    ADD CONSTRAINT "user_credits_ledger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can insert embeddings" ON "public"."course_embeddings" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'org_admin'::"text"]))))));



CREATE POLICY "Admins can manage system prompts" ON "public"."ai_system_prompts" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Allow read access for all authenticated users" ON "public"."prompt_suggestions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow write access for admins" ON "public"."prompt_suggestions" TO "authenticated" USING ((((( SELECT "users"."role"
   FROM "auth"."users"
  WHERE ("users"."id" = "auth"."uid"())))::"text" = 'service_role'::"text") OR (("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ((("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text") OR (("users"."raw_app_meta_data" ->> 'role'::"text") = 'admin'::"text")))))));



CREATE POLICY "Enable read access for all users" ON "public"."courses" FOR SELECT USING (true);



CREATE POLICY "Enable write access for admins" ON "public"."courses" TO "authenticated" USING (((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text") OR (("auth"."jwt"() ->> 'email'::"text") ~~ '%admin%'::"text"))) WITH CHECK (((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text") OR (("auth"."jwt"() ->> 'email'::"text") ~~ '%admin%'::"text")));



CREATE POLICY "Org Admins can manage org collections" ON "public"."user_collections" USING (("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."membership_status" = 'org_admin'::"text")))));



CREATE POLICY "Org Members can view org collection items" ON "public"."collection_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_collections" "uc"
  WHERE (("uc"."id" = "collection_items"."collection_id") AND ("uc"."org_id" IN ( SELECT "profiles"."org_id"
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."membership_status" = 'employee'::"text") OR ("profiles"."membership_status" = 'org_admin'::"text")))))))));



CREATE POLICY "Org Members can view org collections" ON "public"."user_collections" FOR SELECT USING (("org_id" IN ( SELECT "profiles"."org_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."membership_status" = 'employee'::"text") OR ("profiles"."membership_status" = 'org_admin'::"text"))))));



CREATE POLICY "Public can view certificates by ID" ON "public"."certificates" FOR SELECT USING (true);



CREATE POLICY "Public can view orgs by slug (for invite page)" ON "public"."organizations" FOR SELECT USING (true);



CREATE POLICY "Public courses are viewable by everyone" ON "public"."courses" FOR SELECT USING (true);



CREATE POLICY "Public lessons are viewable by everyone" ON "public"."lessons" FOR SELECT USING (true);



CREATE POLICY "Public modules are viewable by everyone" ON "public"."modules" FOR SELECT USING (true);



CREATE POLICY "Public read access to embeddings" ON "public"."course_embeddings" FOR SELECT USING (true);



CREATE POLICY "Public resources are viewable by everyone" ON "public"."resources" FOR SELECT USING (true);



CREATE POLICY "System can insert certificates" ON "public"."certificates" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "System prompts are viewable by everyone" ON "public"."ai_system_prompts" FOR SELECT USING (true);



CREATE POLICY "Users can insert collection items" ON "public"."collection_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_collections"
  WHERE (("user_collections"."id" = "collection_items"."collection_id") AND ("user_collections"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own attempts" ON "public"."user_assessment_attempts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own collections" ON "public"."user_collections" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own ledger (via app logic)" ON "public"."user_credits_ledger" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own progress" ON "public"."user_progress" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own ratings" ON "public"."course_ratings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own collections" ON "public"."user_collections" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own progress" ON "public"."user_progress" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own ratings" ON "public"."course_ratings" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view all ratings" ON "public"."course_ratings" FOR SELECT USING (true);



CREATE POLICY "Users can view their collection items" ON "public"."collection_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_collections"
  WHERE (("user_collections"."id" = "collection_items"."collection_id") AND ("user_collections"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own attempts" ON "public"."user_assessment_attempts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own attribution logs" ON "public"."ai_attribution_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own certificates" ON "public"."certificates" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own collections" ON "public"."user_collections" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own credits" ON "public"."user_credits_ledger" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own ledger" ON "public"."user_credits_ledger" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own memory" ON "public"."user_ai_memory" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own progress" ON "public"."user_progress" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."ai_attribution_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_system_prompts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."certificates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."collection_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."course_embeddings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."course_ratings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lessons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."modules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prompt_suggestions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_ai_memory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_assessment_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_collections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_credits_ledger" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_progress" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."award_course_credits"("p_user_id" "uuid", "p_course_id" bigint, "p_credit_type" "text", "p_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."award_course_credits"("p_user_id" "uuid", "p_course_id" bigint, "p_credit_type" "text", "p_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."award_course_credits"("p_user_id" "uuid", "p_course_id" bigint, "p_credit_type" "text", "p_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_monthly_payout_report"("report_month" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_monthly_payout_report"("report_month" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_monthly_payout_report"("report_month" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_trial_minutes"("p_user_id" "uuid", "p_minutes" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_trial_minutes"("p_user_id" "uuid", "p_minutes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_trial_minutes"("p_user_id" "uuid", "p_minutes" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."match_course_embeddings"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "filter_course_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."match_course_embeddings"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "filter_course_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_course_embeddings"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "filter_course_id" bigint) TO "service_role";



GRANT ALL ON TABLE "public"."ai_attribution_logs" TO "anon";
GRANT ALL ON TABLE "public"."ai_attribution_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_attribution_logs" TO "service_role";



GRANT ALL ON TABLE "public"."ai_content_citations" TO "anon";
GRANT ALL ON TABLE "public"."ai_content_citations" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_content_citations" TO "service_role";



GRANT ALL ON TABLE "public"."ai_system_prompts" TO "anon";
GRANT ALL ON TABLE "public"."ai_system_prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_system_prompts" TO "service_role";



GRANT ALL ON TABLE "public"."certificates" TO "anon";
GRANT ALL ON TABLE "public"."certificates" TO "authenticated";
GRANT ALL ON TABLE "public"."certificates" TO "service_role";



GRANT ALL ON TABLE "public"."collection_items" TO "anon";
GRANT ALL ON TABLE "public"."collection_items" TO "authenticated";
GRANT ALL ON TABLE "public"."collection_items" TO "service_role";



GRANT ALL ON TABLE "public"."context_embeddings" TO "anon";
GRANT ALL ON TABLE "public"."context_embeddings" TO "authenticated";
GRANT ALL ON TABLE "public"."context_embeddings" TO "service_role";



GRANT ALL ON TABLE "public"."course_embeddings" TO "anon";
GRANT ALL ON TABLE "public"."course_embeddings" TO "authenticated";
GRANT ALL ON TABLE "public"."course_embeddings" TO "service_role";



GRANT ALL ON TABLE "public"."course_ratings" TO "anon";
GRANT ALL ON TABLE "public"."course_ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."course_ratings" TO "service_role";



GRANT ALL ON TABLE "public"."courses" TO "anon";
GRANT ALL ON TABLE "public"."courses" TO "authenticated";
GRANT ALL ON TABLE "public"."courses" TO "service_role";



GRANT ALL ON SEQUENCE "public"."courses_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."courses_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."courses_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lessons" TO "anon";
GRANT ALL ON TABLE "public"."lessons" TO "authenticated";
GRANT ALL ON TABLE "public"."lessons" TO "service_role";



GRANT ALL ON TABLE "public"."modules" TO "anon";
GRANT ALL ON TABLE "public"."modules" TO "authenticated";
GRANT ALL ON TABLE "public"."modules" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."prompt_suggestions" TO "anon";
GRANT ALL ON TABLE "public"."prompt_suggestions" TO "authenticated";
GRANT ALL ON TABLE "public"."prompt_suggestions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."prompt_suggestions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."prompt_suggestions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."prompt_suggestions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."resources" TO "anon";
GRANT ALL ON TABLE "public"."resources" TO "authenticated";
GRANT ALL ON TABLE "public"."resources" TO "service_role";



GRANT ALL ON TABLE "public"."user_ai_memory" TO "anon";
GRANT ALL ON TABLE "public"."user_ai_memory" TO "authenticated";
GRANT ALL ON TABLE "public"."user_ai_memory" TO "service_role";



GRANT ALL ON TABLE "public"."user_assessment_attempts" TO "anon";
GRANT ALL ON TABLE "public"."user_assessment_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."user_assessment_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."user_collections" TO "anon";
GRANT ALL ON TABLE "public"."user_collections" TO "authenticated";
GRANT ALL ON TABLE "public"."user_collections" TO "service_role";



GRANT ALL ON TABLE "public"."user_credits_ledger" TO "anon";
GRANT ALL ON TABLE "public"."user_credits_ledger" TO "authenticated";
GRANT ALL ON TABLE "public"."user_credits_ledger" TO "service_role";



GRANT ALL ON TABLE "public"."user_progress" TO "anon";
GRANT ALL ON TABLE "public"."user_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."user_progress" TO "service_role";



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







