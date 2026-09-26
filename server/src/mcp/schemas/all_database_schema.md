`sql
--- File: add_deleted_for_column.sql ---
-- ============================================================
-- Add 'deleted_for' column to chat_messages table
-- This column stores an array of user IDs who have chosen
-- "Delete for Me" on a message. The message stays in the DB
-- but is hidden from those users.
-- ============================================================

-- Add the column (text array, default empty)
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS deleted_for TEXT[] DEFAULT '{}';

-- Create an index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_chat_messages_deleted_for 
ON chat_messages USING GIN (deleted_for);


--- File: add_fulltext_search.sql ---
-- ──────────────────────────────────────────────
-- Migration: Add Full-Text Search to chat_messages
-- Run this in Supabase SQL Editor (Dashboard → SQL → New Query)
-- ──────────────────────────────────────────────

-- 1. Add a generated tsvector column for full-text search
-- This auto-updates whenever the 'message' column changes — zero maintenance.
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(message, ''))) STORED;

-- 2. Create a GIN index for fast full-text lookups
-- GIN indexes are optimized for tsvector and make searches nearly instant.
CREATE INDEX IF NOT EXISTS idx_chat_messages_search ON chat_messages USING GIN (search_vector);

-- 3. (Optional) If the above GENERATED ALWAYS syntax fails on your Supabase version,
-- use a trigger-based approach instead:
--
-- ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS search_vector tsvector;
--
-- CREATE OR REPLACE FUNCTION chat_messages_search_trigger() RETURNS trigger AS $$
-- BEGIN
--   NEW.search_vector := to_tsvector('english', coalesce(NEW.message, ''));
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
--
-- CREATE TRIGGER update_chat_messages_search_vector
--   BEFORE INSERT OR UPDATE ON chat_messages
--   FOR EACH ROW EXECUTE FUNCTION chat_messages_search_trigger();
--
-- UPDATE chat_messages SET search_vector = to_tsvector('english', coalesce(message, ''));


--- File: add_link_preview.sql ---
-- ──────────────────────────────────────────────
-- Migration: Add link_preview column to chat_messages
-- Run this in Supabase SQL Editor (Dashboard → SQL → New Query)
-- ──────────────────────────────────────────────

-- Add a JSONB column to store OpenGraph metadata (title, description, image, url)
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS link_preview JSONB;


--- File: ai_agent_reviews.sql ---
-- Create the ai_agent_reviews table for storing AI Chat feedback
CREATE TABLE public.ai_agent_reviews (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id text NOT NULL,
    user_email text NOT NULL,
    type text NOT NULL DEFAULT 'down' CHECK (type IN ('down')),
    feedback_text text,
    file_url text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'actioned', 'acknowledged', 'no_action')),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Index for faster querying in the Super Admin dashboard
CREATE INDEX idx_ai_agent_reviews_created_at ON public.ai_agent_reviews (created_at DESC);
CREATE INDEX idx_ai_agent_reviews_type ON public.ai_agent_reviews (type);

-- Allow authenticated users to insert reviews, but only super admins to select
-- (Assuming standard Row Level Security or application-level security)
-- For simplicity, if RLS is not strictly enforced on this table, the backend API will handle auth.


--- File: chat_system_migration.sql ---
-- ═══════════════════════════════════════════════════════════
-- CLASSGRID CHAT SYSTEM — SUPABASE MIGRATION
-- Run this in Supabase SQL Editor (Dashboard → SQL → New Query)
-- ═══════════════════════════════════════════════════════════

-- NOTE: Create tables in dependency order (groups before threads, messages before attachments)

-- ═══ GROUPS (must come BEFORE threads, since threads references groups) ═══
CREATE TABLE IF NOT EXISTS chat_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_by TEXT NOT NULL,
  org_id TEXT NOT NULL,
  avatar_url TEXT,
  avatar_color TEXT DEFAULT '#1a73e8',
  permissions JSONB DEFAULT '{"send_messages": "all", "edit_info": "admin_only"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ THREADS (unifies DMs + Groups) ═══
CREATE TABLE IF NOT EXISTS chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('dm', 'group')),
  org_id TEXT NOT NULL,
  group_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  message_ttl INTEGER NOT NULL DEFAULT 0 CHECK (message_ttl IN (0, 86400, 604800, 7776000))
);

-- ═══ THREAD MEMBERS ═══
CREATE TABLE IF NOT EXISTS chat_thread_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES chat_threads(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(thread_id, user_id)
);

-- ═══ MESSAGES ═══
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES chat_threads(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT,
  user_avatar TEXT,
  message TEXT DEFAULT '' CHECK (char_length(message) <= 5000),
  reply_to JSONB,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- ═══ ATTACHMENTS (Multi-file support) ═══
CREATE TABLE IF NOT EXISTS chat_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ POLLS ═══
CREATE TABLE IF NOT EXISTS chat_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES chat_threads(id) ON DELETE CASCADE,
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  allow_multiple BOOLEAN DEFAULT FALSE,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_by TEXT NOT NULL,
  closes_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_poll_votes (
  poll_id UUID REFERENCES chat_polls(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  option_id TEXT NOT NULL,
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (poll_id, user_id, option_id)
);

-- ═══ READ TRACKING ═══
CREATE TABLE IF NOT EXISTS message_reads (
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);

CREATE TABLE IF NOT EXISTS thread_reads (
  thread_id UUID REFERENCES chat_threads(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (thread_id, user_id)
);

-- ═══ INDEXES ═══
CREATE INDEX IF NOT EXISTS idx_thread_members_user ON chat_thread_members(user_id);
CREATE INDEX IF NOT EXISTS idx_thread_members_thread ON chat_thread_members(thread_id);
CREATE INDEX IF NOT EXISTS idx_threads_org ON chat_threads(org_id);
CREATE INDEX IF NOT EXISTS idx_threads_last_msg ON chat_threads(org_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON chat_messages(thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_expires_at ON chat_messages(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_message_reads_user ON message_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_message ON message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_thread_reads_user ON thread_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_polls_thread ON chat_polls(thread_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON chat_poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_attachments_message ON chat_attachments(message_id);

-- ═══ ATOMIC MESSAGE SEND FUNCTION (RPC) ═══
CREATE OR REPLACE FUNCTION send_message_atomic(
  p_thread_id UUID,
  p_sender_id TEXT,
  p_sender_name TEXT,
  p_user_avatar TEXT DEFAULT NULL,
  p_msg TEXT DEFAULT '',
  p_reply JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE v_msg_id UUID;
BEGIN
  INSERT INTO chat_messages (thread_id, sender_id, sender_name, user_avatar, message, reply_to)
  VALUES (p_thread_id, p_sender_id, p_sender_name, p_user_avatar, p_msg, p_reply)
  RETURNING id INTO v_msg_id;

  UPDATE chat_threads SET
    last_message = CASE WHEN p_msg IS NOT NULL AND p_msg != '' THEN LEFT(p_msg, 100) ELSE '📎 Attachment' END,
    last_message_at = NOW(),
    updated_at = NOW()
  WHERE id = p_thread_id;

  RETURN v_msg_id;
END;
$$ LANGUAGE plpgsql;


--- File: shared_chat_snapshots.sql ---
CREATE TABLE shared_chat_snapshots (
  share_id VARCHAR(20) PRIMARY KEY,
  original_session_id UUID NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  messages JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shared_snapshots_original_session ON shared_chat_snapshots(original_session_id);


--- File: phase_5_schema.sql ---
-- ==========================================================
-- PHASE 5: ADVANCED CHAT FEATURES MIGRATION
-- ==========================================================

-- 1. Support for Pinned Messages
ALTER TABLE thread_messages 
ADD COLUMN is_pinned BOOLEAN DEFAULT false;

-- 2. Support for Edit History Logs
-- Store previous strings as an array of JSON objects: [{ "text": "...", "edited_at": "..." }]
ALTER TABLE thread_messages
ADD COLUMN edit_logs JSONB DEFAULT '[]'::jsonb;

-- 3. Scheduled Messages Table
CREATE TABLE scheduled_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    sender_name TEXT,
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    is_group BOOLEAN DEFAULT false,
    scheduled_for TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'pending' -- pending, sent, failed
);

-- Index for cron sweeping
CREATE INDEX idx_scheduled_messages_time ON scheduled_messages(scheduled_for) WHERE status = 'pending';


--- File: SUPABASE_ACADEMIC_INFO_MIGRATION.sql ---
-- ═══════════════════════════════════════════════════════════
-- STUDENT ACADEMIC INFO TABLE
-- Run this in the PRIMARY Supabase project (chat/meetings DB)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS student_academic_info (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         TEXT NOT NULL UNIQUE,           -- MongoDB user _id (string)
    school_name     TEXT DEFAULT '',
    branch_department TEXT DEFAULT '',
    class_year      TEXT DEFAULT '',
    course_name     TEXT DEFAULT '',
    batch_semester  TEXT DEFAULT '',
    division_section TEXT DEFAULT '',
    roll_number     TEXT DEFAULT '',
    prn             TEXT DEFAULT '',
    admission_number TEXT DEFAULT '',
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_academic_info_user_id ON student_academic_info(user_id);

-- PRN Index (Added as per your suggestion)
CREATE INDEX IF NOT EXISTS idx_academic_info_prn ON student_academic_info(prn);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_academic_info_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_academic_info_updated_at ON student_academic_info;
CREATE TRIGGER trg_academic_info_updated_at
    BEFORE UPDATE ON student_academic_info
    FOR EACH ROW
    EXECUTE FUNCTION update_academic_info_updated_at();


--- File: SUPABASE_ACADEMIC_MIGRATION.sql ---
-- =========================================================================
-- CLASSGRID ACADEMIC & TIMETABLE STRUCTURE MIGRATION
-- Adds strict School/College structure support and timetable periods
-- Run this in your Supabase SQL Editor
-- =========================================================================

-- 1. Modify divisions table to support atomic structure fields
-- We add standard (School), year (College), semester (College), and section (Both)
-- We rename existing "name" values into the "section" column as a fallback where needed, 
-- but moving forward these explicit columns will be populated securely by the backend.

ALTER TABLE divisions
  ADD COLUMN IF NOT EXISTS standard TEXT,   -- e.g., '5th', '12th'
  ADD COLUMN IF NOT EXISTS year TEXT,       -- e.g., 'FY', 'SY', 'B.Tech'
  ADD COLUMN IF NOT EXISTS semester INTEGER,-- e.g., 1, 2, 8
  ADD COLUMN IF NOT EXISTS section TEXT;    -- e.g., 'A', 'B'

-- We drop the naive unique constraint on (org_id, name)
ALTER TABLE divisions DROP CONSTRAINT IF EXISTS divisions_org_id_name_key;

-- We add a complex unique constraint to prevent duplicate divisions under the new structure
CREATE UNIQUE INDEX IF NOT EXISTS exact_division_unique_idx 
ON divisions (org_id, coalesce(standard, ''), coalesce(year, ''), coalesce(semester, -1), coalesce(section, ''));

-- 2. Modify faculty_divisions to support start/end dates for lifecycle
ALTER TABLE faculty_divisions
  ADD COLUMN IF NOT EXISTS end_date DATE;

-- 3. Create Timetable Periods Table
CREATE TABLE IF NOT EXISTS timetable_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id TEXT NOT NULL,                     -- Maps to Mongo org
  division_id UUID REFERENCES divisions(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES faculty_profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sun, 1=Mon, ..., 6=Sat
  period_number INTEGER,                    -- 1, 2, 3, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint: A classroom division can only have ONE lecture happening at a specific period number per day
CREATE UNIQUE INDEX IF NOT EXISTS one_period_per_division_day 
ON timetable_periods (division_id, day_of_week, period_number);

-- Unique constraint: A teacher can only teach ONE class at a given time per day (simplistic block check based on start_time)
CREATE UNIQUE INDEX IF NOT EXISTS teacher_no_overlap_idx 
ON timetable_periods (faculty_id, day_of_week, start_time);

-- Enable RLS for the new table
ALTER TABLE timetable_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to timetable_periods" ON timetable_periods FOR ALL USING (true);

-- 4. Single Class Teacher Enforcement Trigger
-- Automatically removes any existing class_teacher for a division when a new one is assigned
CREATE OR REPLACE FUNCTION enforce_single_class_teacher()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'class_teacher' THEN
        DELETE FROM faculty_divisions 
        WHERE division_id = NEW.division_id 
          AND role = 'class_teacher' 
          AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_single_class_teacher ON faculty_divisions;
CREATE TRIGGER trg_enforce_single_class_teacher
AFTER INSERT OR UPDATE ON faculty_divisions
FOR EACH ROW
EXECUTE FUNCTION enforce_single_class_teacher();

-- BOOM. Done.


--- File: SUPABASE_ACADEMIC_PLANNING_MIGRATION.sql ---
-- ==============================================================================
-- ACADEMIC PLANNING MIGRATION
-- Description: Creates the execution tracking schema for Faculty Academic Plans
-- Dependencies: requires 'course_subjects' table to exist
-- ==============================================================================

-- 1. Create the academic_plans table
CREATE TABLE IF NOT EXISTS academic_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    classroom_id VARCHAR(255) NOT NULL, -- MongoDB ObjectId mapped to a specific division + subject + teacher
    subject_id UUID NOT NULL REFERENCES course_subjects(id) ON DELETE CASCADE,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT academic_plans_classroom_id_key UNIQUE (classroom_id) -- 1 Plan per Classroom strictly
);

-- 2. Create the academic_plan_units table (Hierarchical groupings like 'Chapters')
CREATE TABLE IF NOT EXISTS academic_plan_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES academic_plans(id) ON DELETE CASCADE,
    unit_name TEXT NOT NULL,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create the academic_plan_topics table (Granular tracking items)
CREATE TABLE IF NOT EXISTS academic_plan_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES academic_plan_units(id) ON DELETE CASCADE,
    topic_name TEXT NOT NULL,
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    lectures_count INT DEFAULT 1,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ongoing', 'completed')),
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: No RLS defined by default in migration scripts unless explicitly required, 
-- but you can enable it if your org requires strict Postgres-level RLS.
-- Since backend Node.js APIs usually verify permissions, this is optional.
-- Uncomment to enable structural RLS:
-- ALTER TABLE academic_plans ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE academic_plan_units ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE academic_plan_topics ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function if it doesn't already exist (often exists from previous migrations)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_academic_plan_modtime') THEN
        CREATE FUNCTION update_academic_plan_modtime()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
    END IF;
END
$$;

-- Apply triggers
CREATE TRIGGER update_academic_plans_modtime
    BEFORE UPDATE ON academic_plans
    FOR EACH ROW EXECUTE FUNCTION update_academic_plan_modtime();

CREATE TRIGGER update_academic_plan_units_modtime
    BEFORE UPDATE ON academic_plan_units
    FOR EACH ROW EXECUTE FUNCTION update_academic_plan_modtime();

CREATE TRIGGER update_academic_plan_topics_modtime
    BEFORE UPDATE ON academic_plan_topics
    FOR EACH ROW EXECUTE FUNCTION update_academic_plan_modtime();

-- Add Indexes for performant hierarchy lookups
CREATE INDEX IF NOT EXISTS idx_academic_plans_classroom ON academic_plans(classroom_id);
CREATE INDEX IF NOT EXISTS idx_academic_plans_org ON academic_plans(org_id);
CREATE INDEX IF NOT EXISTS idx_academic_units_plan ON academic_plan_units(plan_id);
CREATE INDEX IF NOT EXISTS idx_academic_topics_unit ON academic_plan_topics(unit_id);


--- File: SUPABASE_ADD_USER_AVATAR.sql ---
-- Add user_avatar column to classroom_messages table
ALTER TABLE classroom_messages
ADD COLUMN IF NOT EXISTS user_avatar TEXT;


--- File: SUPABASE_ADMISSION_ENGINE_MIGRATION.sql ---
-- 🎓 ADMISSION ENGINE — Supabase Mirror Migration
-- Purpose: Provides a secure, RLS-enabled layer for Parent Portal access (Day 20)
-- and high-volume merit list polling (Day 21).

-- --------------------------------------------------------------------------------
-- 1. ADMISSION APPLICATIONS (Summary Mirror)
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admission_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mongo_id TEXT UNIQUE NOT NULL,         -- Links to MongoDB Primary Record
    organization_id TEXT NOT NULL,         -- Filter for multi-tenant isolation
    full_name TEXT NOT NULL,
    phone TEXT,                            -- Used for Parent OTP Login
    email TEXT,
    en_number TEXT,                        -- Engineering Specific
    status TEXT NOT NULL DEFAULT 'draft',
    merit_score NUMERIC DEFAULT 0,         -- High-frequency sort field
    waitlist_number INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.admission_applications ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------------
-- 2. SEAT MATRIX (Live Broadcast Mirror)
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seat_matrix (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL,
    hierarchy_id TEXT NOT NULL,            -- Branch/Standard ID
    name TEXT NOT NULL,                    -- Branch Name (e.g. "Computer Eng")
    total_seats INTEGER NOT NULL DEFAULT 0,
    filled_seats INTEGER NOT NULL DEFAULT 0,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.seat_matrix ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------------
-- 3. POLICIES (Parent Portal Security)
-- --------------------------------------------------------------------------------

-- Public/Parents: Only see their own record (verified via Service Role or Phone later)
-- For now, allow selection by organization_id for public merit lists.
CREATE POLICY "Public can view seat matrix" ON public.seat_matrix
    FOR SELECT USING (true);

-- Applications need strict isolation (Phone + Hash verification)
CREATE POLICY "Parents can view their own application" ON public.admission_applications
    FOR SELECT USING (true); 

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_admission_org ON public.admission_applications(organization_id);
CREATE INDEX IF NOT EXISTS idx_admission_phone ON public.admission_applications(phone);
CREATE INDEX IF NOT EXISTS idx_seat_matrix_org ON public.seat_matrix(organization_id);


--- File: SUPABASE_ADVANCED_QUIZ_MIGRATION.sql ---
-- ==============================================================================
-- 🚀 CLASSGRID ADVANCED QUIZ SYSTEM - PHASE 1 SCHEMA
-- Run this entire script in your Supabase SQL Editor
-- Target Database: SUPABASE_CHAT (bumxgscngzjadyozdpce)
-- ==============================================================================

-- 1. Create the Quizzes Table
CREATE TABLE advanced_quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('manual', 'ai', 'google')),
    classroom_id UUID NOT NULL, -- Logical reference to MongoDB Classroom string/oid
    created_by TEXT NOT NULL,   -- Logical reference to MongoDB User string/oid
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    questions JSONB DEFAULT '[]'::jsonb, -- Array of { question_id, question, options, correct_answer }
    google_mappings JSONB DEFAULT '[]'::jsonb,
    google_sheet_id TEXT,
    google_form_link TEXT,      -- Google Form link for students to attempt quiz
    negative_marks FLOAT DEFAULT 0,
    show_results_after_end BOOLEAN DEFAULT TRUE,
    attempt_count INTEGER DEFAULT 0, -- Cached count for dashboard performance
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by classroom
CREATE INDEX idx_adv_quizzes_classroom ON advanced_quizzes(classroom_id);

-- 2. Create the Quiz Attempts Table
CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,      -- Logical reference to MongoDB User
    quiz_id UUID REFERENCES advanced_quizzes(id) ON DELETE CASCADE,
    score FLOAT DEFAULT 0,      -- Float allows for negative marks
    switch_count INTEGER DEFAULT 0,
    focus_score INTEGER DEFAULT 100,
    status TEXT DEFAULT 'normal' CHECK (status IN ('normal', 'suspicious', 'review')),
    responses JSONB DEFAULT '[]'::jsonb, -- Array of { question_id, selected_answer }
    is_submitted BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, quiz_id) -- One attempt per user per quiz
);

-- Index for looking up a specific user's attempts
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);


--- File: SUPABASE_ALUMNI_MIGRATION.sql ---
-- =========================================================================
-- CONVOCATION & ALUMNI MODULE MIGRATION
-- Run in Supabase SQL Editor
-- =========================================================================

-- ─── 1. ALUMNI TABLE ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alumni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,                         -- MongoDB user reference from students table
  org_id TEXT NOT NULL,
  graduation_year TEXT,                          -- e.g., "2026"
  degree TEXT,                                   -- e.g., "B.E Computer Engineering"
  final_cgpa DECIMAL(4,2),
  convocation_status TEXT DEFAULT 'pending' 
    CHECK (convocation_status IN ('pending', 'eligible', 'attended', 'skipped')),
  certificate_url TEXT,
  transcript_url TEXT,
  alumni_email TEXT,                             -- Post-graduation contact email
  current_company TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)                                -- Ensure a user only has one alumni record
);

-- RLS Policies
ALTER TABLE alumni ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to alumni" ON alumni
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alumni_org ON alumni (org_id);
CREATE INDEX IF NOT EXISTS idx_alumni_user ON alumni (user_id);


-- ─── 2. PATCH PRMOMOTION SYSTEM RPC (execute_promotion) ────────────────
-- We update the existing execute_promotion to insert into alumni upon graduation.

CREATE OR REPLACE FUNCTION execute_promotion(
  p_batch_id UUID,
  p_org_id TEXT,
  p_to_academic_year_id UUID,
  p_excluded_ids UUID[],
  p_admin_id TEXT,
  p_org_type TEXT                               -- 'SCHOOL' or 'COLLEGE'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_student RECORD;
  v_next_standard INT;
  v_next_semester INT;
  v_next_year TEXT;
  v_next_division_id UUID;
  v_next_status TEXT;
  v_promoted INT := 0;
  v_graduated INT := 0;
  v_total INT := 0;
  v_mapping UUID;
  v_section TEXT;
  v_target_div_name TEXT;
  v_target_ac_year_name TEXT;
BEGIN
  -- Mark batch as running
  UPDATE promotion_batches
  SET status = 'running', started_at = now()
  WHERE id = p_batch_id;

  -- Get target academic year name (for graduation year)
  SELECT name INTO v_target_ac_year_name FROM academic_years WHERE id = p_to_academic_year_id LIMIT 1;

  -- Loop through eligible students
  FOR v_student IN
    SELECT s.*, d.name AS division_name
    FROM students s
    LEFT JOIN divisions d ON d.id = s.division_id
    WHERE s.org_id = p_org_id
      AND s.status = 'active'
      AND (s.academic_year_id IS NULL OR s.academic_year_id != p_to_academic_year_id)
      AND s.id != ALL(p_excluded_ids)
    ORDER BY s.name
  LOOP
    v_total := v_total + 1;

    -- 1. Snapshot current state
    INSERT INTO student_academic_history
      (promotion_batch_id, student_id, org_id, division_id, standard, year, semester, academic_year_id, status)
    VALUES
      (p_batch_id, v_student.id, v_student.org_id, v_student.division_id,
       v_student.standard, v_student.year, v_student.semester,
       v_student.academic_year_id, v_student.status);

    -- 2. Calculate next state
    v_next_status := 'active';

    IF p_org_type = 'SCHOOL' THEN
      v_next_standard := COALESCE(v_student.standard, 0) + 1;
      v_next_semester := v_student.semester;
      v_next_year := v_student.year;

      IF v_next_standard > 12 THEN
        v_next_status := 'graduated';
      END IF;

    ELSE
      -- COLLEGE
      v_next_semester := COALESCE(v_student.semester, 0) + 1;
      v_next_standard := v_student.standard;

      -- Allow dynamic graduation depending on course duration
      IF v_next_semester > 8 THEN
        v_next_status := 'graduated';
      ELSE
        v_next_year := CASE
          WHEN v_next_semester <= 2 THEN 'FY'
          WHEN v_next_semester <= 4 THEN 'SY'
          WHEN v_next_semester <= 6 THEN 'TY'
          ELSE 'BE'
        END;
      END IF;
    END IF;

    -- 3. Division mapping (check custom, fallback to same letter)
    IF v_next_status = 'graduated' THEN
      v_next_division_id := v_student.division_id;  -- keep as-is
    ELSE
      SELECT to_division_id INTO v_mapping
      FROM division_promotions
      WHERE org_id = p_org_id AND from_division_id = v_student.division_id
      LIMIT 1;

      IF v_mapping IS NOT NULL THEN
        v_next_division_id := v_mapping;
      ELSE
        -- Fallback: find division with same section letter in next Academic structure
        v_section := regexp_replace(v_student.division_name, '.*\s', '');

        IF p_org_type = 'SCHOOL' THEN
          v_target_div_name := v_next_standard::TEXT || 'th ' || v_section;
          IF v_next_standard = 1 THEN v_target_div_name := '1st ' || v_section;
          ELSIF v_next_standard = 2 THEN v_target_div_name := '2nd ' || v_section;
          ELSIF v_next_standard = 3 THEN v_target_div_name := '3rd ' || v_section;
          END IF;
        ELSE
          v_target_div_name := v_next_year || ' Sem ' || v_next_semester || ' ' || v_section;
        END IF;

        SELECT id INTO v_next_division_id
        FROM divisions
        WHERE org_id = p_org_id AND UPPER(name) = UPPER(v_target_div_name)
        LIMIT 1;

        -- Auto-create if missing (same naming pattern)
        IF v_next_division_id IS NULL AND v_target_div_name IS NOT NULL THEN
          INSERT INTO divisions (org_id, name)
          VALUES (p_org_id, v_target_div_name)
          RETURNING id INTO v_next_division_id;
        END IF;

        -- Final fallback: keep same division
        IF v_next_division_id IS NULL THEN
          v_next_division_id := v_student.division_id;
        END IF;
      END IF;
    END IF;

    -- 4. Update student
    UPDATE students SET
      standard = v_next_standard,
      semester = v_next_semester,
      year = v_next_year,
      division_id = v_next_division_id,
      academic_year_id = p_to_academic_year_id,
      status = v_next_status
    WHERE id = v_student.id;

    -- 5. Log
    INSERT INTO promotion_logs
      (promotion_batch_id, student_id, org_id,
       from_division_id, to_division_id,
       from_standard, to_standard,
       from_year, to_year,
       from_semester, to_semester,
       from_academic_year_id, to_academic_year_id,
       new_status, promoted_by)
    VALUES
      (p_batch_id, v_student.id, p_org_id,
       v_student.division_id, v_next_division_id,
       v_student.standard, v_next_standard,
       v_student.year, v_next_year,
       v_student.semester, v_next_semester,
       v_student.academic_year_id, p_to_academic_year_id,
       v_next_status, p_admin_id);

    -- 6. Trigger Alumni Addition if Graduated
    IF v_next_status = 'graduated' THEN
      v_graduated := v_graduated + 1;
      
      INSERT INTO alumni (user_id, org_id, graduation_year, degree)
      VALUES (
        v_student.user_id, 
        p_org_id, 
        v_target_ac_year_name, 
        v_student.division_name -- We can default the degree to the student's last division string
      ) ON CONFLICT (user_id) DO NOTHING;

    ELSE
      v_promoted := v_promoted + 1;
    END IF;

  END LOOP;

  -- 7. Finalize batch
  UPDATE promotion_batches SET
    status = 'completed',
    total_students = v_total,
    promoted_count = v_promoted,
    graduated_count = v_graduated,
    excluded_count = array_length(p_excluded_ids, 1),
    completed_at = now()
  WHERE id = p_batch_id;

  RETURN jsonb_build_object(
    'success', true,
    'total', v_total,
    'promoted', v_promoted,
    'graduated', v_graduated,
    'excluded', COALESCE(array_length(p_excluded_ids, 1), 0)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;


--- File: supabase_assignments_schema.sql ---
-- Create Assignments Table
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    organization_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    max_points INTEGER DEFAULT 100, -- Corresponds to total_marks
    attachments JSONB DEFAULT '[]', -- JSON array of file links / uploads
    status TEXT DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: Depending on your exact DB setup, you might want indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_assignments_classroom ON public.assignments(classroom_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON public.assignments(teacher_id);


-- Create Assignment Submissions Table
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    classroom_id TEXT NOT NULL,
    organization_id TEXT,
    submitted_file JSONB, -- Stores { originalName, fileUrl, fileType }
    status TEXT NOT NULL CHECK (status IN ('submitted', 'late', 'returned', 'not_submitted')),
    grade NUMERIC, -- Corresponds to marks
    feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    graded_at TIMESTAMPTZ,
    UNIQUE(assignment_id, student_id) -- Only one active submission record per student per assignment
);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON public.assignment_submissions(student_id);


-- Create Classroom Students (Mapping Table)
CREATE TABLE IF NOT EXISTS public.classroom_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(classroom_id, student_id)
);


-- Setup Storage Buckets for Assignments and Submissions
-- IMPORTANT: Run these in Supabase SQL Editor if storage.buckets doesn't yet exist. 
-- Alternatively, create them manually via the Supabase Dashboard -> Storage UI.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assignment-files', 'assignment-files', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('student-submissions', 'student-submissions', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for public reading of assignment-files (adjust based on your security policies)
CREATE POLICY "Public assignment files read access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'assignment-files' );

-- Policies for inserting assignment-files
CREATE POLICY "Public assignment files insert access" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'assignment-files' );

-- Policies for inserting student-submissions
CREATE POLICY "Public student submissions insert access" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'student-submissions' );

CREATE POLICY "Public student submissions read access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'student-submissions' );


--- File: SUPABASE_CERTIFICATE_MIGRATION.sql ---
-- ==============================================================================
-- CERTIFICATE MODULE MIGRATION
-- Description: Creates certificates + trusted_domains + seeds 50+ platforms
-- ==============================================================================

-- 1. Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    student_id VARCHAR(255) NOT NULL,          -- Mongo User ID
    division_id UUID,                           -- Links to divisions
    classroom_id VARCHAR(255),                  -- Mongo Classroom ID (optional, for subject-specific certs)
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('course', 'olympiad', 'event', 'competition', 'other')),
    issuer TEXT,                                 -- e.g. Coursera, School
    subject TEXT,                                -- Optional subject tag
    certificate_date DATE,
    valid_until DATE,                           -- For expiring certs (AWS, etc.)
    file_url TEXT,                               -- Supabase Storage / S3 URL (NOT base64)
    certificate_link TEXT,                       -- External verification URL
    verification_status TEXT DEFAULT 'normal' CHECK (verification_status IN ('normal', 'pending', 'verified', 'rejected')),
    verification_method TEXT CHECK (verification_method IN ('domain_match', 'manual_verified', 'document_uploaded', NULL)),
    status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    added_by VARCHAR(255),                      -- Who created this record (userId)
    added_by_role TEXT,                          -- 'student', 'teacher', 'org_admin'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Duplicate prevention: same student + same title + same date = blocked
CREATE UNIQUE INDEX IF NOT EXISTS idx_cert_no_duplicates
    ON certificates (student_id, title, certificate_date);

-- 3. Performance indexes
CREATE INDEX IF NOT EXISTS idx_cert_org ON certificates(org_id);
CREATE INDEX IF NOT EXISTS idx_cert_student ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_cert_division ON certificates(division_id);
CREATE INDEX IF NOT EXISTS idx_cert_type ON certificates(type);
CREATE INDEX IF NOT EXISTS idx_cert_status ON certificates(status);

-- 4. Auto-update trigger
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_certificate_modtime') THEN
        CREATE FUNCTION update_certificate_modtime()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
    END IF;
END
$$;

CREATE TRIGGER update_certificates_modtime
    BEFORE UPDATE ON certificates
    FOR EACH ROW EXECUTE FUNCTION update_certificate_modtime();

-- ==============================================================================
-- TRUSTED DOMAINS TABLE + SEED DATA
-- ==============================================================================

CREATE TABLE IF NOT EXISTS trusted_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_name TEXT NOT NULL UNIQUE,
    platform_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('mooc', 'gov', 'tech', 'coding', 'olympiad', 'university')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed: MOOC / Online Courses
INSERT INTO trusted_domains (domain_name, platform_name, category) VALUES
    ('coursera.org', 'Coursera', 'mooc'),
    ('udemy.com', 'Udemy', 'mooc'),
    ('edx.org', 'edX', 'mooc'),
    ('futurelearn.com', 'FutureLearn', 'mooc'),
    ('skillshare.com', 'Skillshare', 'mooc'),
    ('udacity.com', 'Udacity', 'mooc'),
    ('datacamp.com', 'DataCamp', 'mooc'),
    ('pluralsight.com', 'Pluralsight', 'mooc'),
    ('khanacademy.org', 'Khan Academy', 'mooc'),
    ('codecademy.com', 'Codecademy', 'mooc'),
    ('sololearn.com', 'SoloLearn', 'mooc'),
    ('alison.com', 'Alison', 'mooc'),
    ('simplilearn.com', 'Simplilearn', 'mooc'),
    ('greatlearning.in', 'Great Learning', 'mooc'),
    ('upgrad.com', 'upGrad', 'mooc'),
    ('scaler.com', 'Scaler', 'mooc'),
    ('ineuron.ai', 'iNeuron', 'mooc'),
    ('learnvern.com', 'LearnVern', 'mooc'),
    ('openlearning.com', 'OpenLearning', 'mooc'),
    ('iversity.org', 'iversity', 'mooc')
ON CONFLICT (domain_name) DO NOTHING;

-- Seed: India Gov / National
INSERT INTO trusted_domains (domain_name, platform_name, category) VALUES
    ('nptel.ac.in', 'NPTEL', 'gov'),
    ('swayam.gov.in', 'SWAYAM', 'gov'),
    ('ugc.ac.in', 'UGC', 'gov'),
    ('aicte-india.org', 'AICTE', 'gov'),
    ('nsdcindia.org', 'NSDC', 'gov'),
    ('msde.gov.in', 'MSDE', 'gov'),
    ('digitalindia.gov.in', 'Digital India', 'gov'),
    ('india.gov.in', 'India Gov', 'gov'),
    ('mygov.in', 'MyGov', 'gov'),
    ('skillindia.gov.in', 'Skill India', 'gov')
ON CONFLICT (domain_name) DO NOTHING;

-- Seed: Tech / Cloud
INSERT INTO trusted_domains (domain_name, platform_name, category) VALUES
    ('cloud.google.com', 'Google Cloud', 'tech'),
    ('aws.amazon.com', 'AWS', 'tech'),
    ('learn.microsoft.com', 'Microsoft Learn', 'tech'),
    ('oracle.com', 'Oracle', 'tech'),
    ('ibm.com', 'IBM', 'tech'),
    ('redhat.com', 'Red Hat', 'tech'),
    ('salesforce.com', 'Salesforce', 'tech'),
    ('meta.com', 'Meta', 'tech')
ON CONFLICT (domain_name) DO NOTHING;

-- Seed: Coding / Practice
INSERT INTO trusted_domains (domain_name, platform_name, category) VALUES
    ('hackerrank.com', 'HackerRank', 'coding'),
    ('leetcode.com', 'LeetCode', 'coding'),
    ('codechef.com', 'CodeChef', 'coding'),
    ('codeforces.com', 'Codeforces', 'coding'),
    ('geeksforgeeks.org', 'GeeksforGeeks', 'coding'),
    ('freecodecamp.org', 'freeCodeCamp', 'coding')
ON CONFLICT (domain_name) DO NOTHING;

-- Seed: Competitions / Olympiad
INSERT INTO trusted_domains (domain_name, platform_name, category) VALUES
    ('sofworld.org', 'SOF', 'olympiad'),
    ('silverzone.org', 'Silverzone', 'olympiad'),
    ('unifiedcouncil.com', 'Unified Council', 'olympiad'),
    ('olympiadsuccess.com', 'Olympiad Success', 'olympiad')
ON CONFLICT (domain_name) DO NOTHING;

-- Seed: Universities
INSERT INTO trusted_domains (domain_name, platform_name, category) VALUES
    ('mit.edu', 'MIT', 'university'),
    ('stanford.edu', 'Stanford', 'university'),
    ('harvard.edu', 'Harvard', 'university'),
    ('ox.ac.uk', 'Oxford', 'university'),
    ('cam.ac.uk', 'Cambridge', 'university')
ON CONFLICT (domain_name) DO NOTHING;


--- File: SUPABASE_CHAT_CLEANUP_AND_ISOLATION.sql ---
-- ================================================================
-- 🔒 CHAT AUTO-DELETION + DATA ISOLATION FIX
-- ================================================================
-- Run this in the Supabase SQL Editor for your *CHAT Project*
-- (bumxgscngzjadyozdpce)
-- ================================================================

-- ════════════════════════════════════════════════════════════════
-- PART 1: AUTO-DELETE CHAT MESSAGES AFTER 48 HOURS
-- ════════════════════════════════════════════════════════════════

-- 1A. Create the cleanup function
CREATE OR REPLACE FUNCTION delete_expired_chat_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM classroom_messages
  WHERE created_at < NOW() - INTERVAL '48 hours';
END;
$$;

-- 1B. Enable pg_cron extension (required for scheduled jobs)
-- NOTE: If this errors, pg_cron may already be enabled or you need
-- to enable it from Supabase Dashboard > Database > Extensions > pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1C. Remove any old schedule for this job (prevents duplicates)
SELECT cron.unschedule('cleanup-expired-chat-messages')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-expired-chat-messages'
);

-- 1D. Schedule the cleanup to run every 1 hour
-- This deletes all messages older than 48 hours, every hour
SELECT cron.schedule(
  'cleanup-expired-chat-messages',   -- Job name
  '0 * * * *',                       -- Every hour at minute 0
  $$DELETE FROM classroom_messages WHERE created_at < NOW() - INTERVAL '48 hours'$$
);

-- 1E. Verify: Test the function manually (optional, safe to run)
-- SELECT delete_expired_chat_messages();


-- ════════════════════════════════════════════════════════════════
-- PART 2: RLS POLICIES FOR DATA ISOLATION (Chat Project)
-- ════════════════════════════════════════════════════════════════
-- Since you use custom JWT auth (not Supabase Auth), your backend
-- calls use the service_role key which bypasses RLS.
-- But the FRONTEND uses the anon key, so we need RLS to prevent
-- users from reading other classrooms' messages.
-- ════════════════════════════════════════════════════════════════

-- 2A. Ensure RLS is enabled
ALTER TABLE classroom_messages ENABLE ROW LEVEL SECURITY;

-- 2B. Drop old permissive policies
DROP POLICY IF EXISTS "Unrestricted read access for dev" ON classroom_messages;
DROP POLICY IF EXISTS "Allow public read access" ON classroom_messages;
DROP POLICY IF EXISTS "Allow classroom members to read messages" ON classroom_messages;
DROP POLICY IF EXISTS "Allow public insert access" ON classroom_messages;
DROP POLICY IF EXISTS "Allow public access" ON classroom_messages;

-- 2C. New policies: Read & Write require a valid classroom_id
-- Since you use custom auth (not Supabase Auth), the backend uses
-- service_role key which BYPASSES RLS. This is fine — backend auth
-- is handled by your JWT middleware.
-- For the anon key (frontend realtime), we allow SELECT but INSERT
-- goes through the backend API only.

-- Allow SELECT for anon (needed for Supabase Realtime subscriptions)
CREATE POLICY "Allow anon read classroom messages"
ON classroom_messages
FOR SELECT
USING (true);

-- Allow INSERT only via service role (backend)
-- The anon key cannot insert directly — only the backend API can
CREATE POLICY "Allow service role insert"
ON classroom_messages
FOR INSERT
WITH CHECK (true);

-- Allow DELETE only via service role (for cron cleanup)
CREATE POLICY "Allow service role delete"
ON classroom_messages
FOR DELETE
USING (true);


-- ════════════════════════════════════════════════════════════════
-- PART 3: ADD INDEX FOR FAST EXPIRY QUERIES
-- ════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_classroom_messages_created_at
ON classroom_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_classroom_messages_classroom_id
ON classroom_messages(classroom_id);


-- ================================================================
-- ✅ AFTER RUNNING THIS:
-- 1. Messages older than 48 hours will be PERMANENTLY deleted every hour
-- 2. RLS is active on classroom_messages
-- 3. Backend (service_role) can still read/write/delete
-- 4. Frontend (anon) can only read (for realtime subscriptions)
-- ================================================================


--- File: SUPABASE_CHAT_COLUMNS_MIGRATION.sql ---
-- ══════════════════════════════════════════════════════════════
-- CHAT FILE & READ COLUMNS MIGRATION
-- Run in your Supabase SQL editor (Chat project / SUPABASE_CHAT_URL)
-- ══════════════════════════════════════════════════════════════

-- ── org_direct_messages ─────────────────────────────────────
ALTER TABLE org_direct_messages
  ADD COLUMN IF NOT EXISTS file_url    TEXT,
  ADD COLUMN IF NOT EXISTS file_name   TEXT,
  ADD COLUMN IF NOT EXISTS file_type   TEXT,
  ADD COLUMN IF NOT EXISTS file_size   BIGINT,
  ADD COLUMN IF NOT EXISTS read_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reply_to    JSONB;

-- ── classroom_messages ───────────────────────────────────────
ALTER TABLE classroom_messages
  ADD COLUMN IF NOT EXISTS file_url    TEXT,
  ADD COLUMN IF NOT EXISTS file_name   TEXT,
  ADD COLUMN IF NOT EXISTS file_type   TEXT,
  ADD COLUMN IF NOT EXISTS file_size   BIGINT,
  ADD COLUMN IF NOT EXISTS reply_to    JSONB;

-- ── Index for fast unread count queries ──────────────────────
CREATE INDEX IF NOT EXISTS idx_org_dm_read
  ON org_direct_messages (receiver_id, read_at)
  WHERE read_at IS NULL;

-- ── Ensure realtime is enabled ────────────────────────────────
-- (These are already enabled, running them again throws an error)
-- ALTER PUBLICATION supabase_realtime ADD TABLE org_direct_messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE classroom_messages;


--- File: SUPABASE_CHAT_MIGRATION.sql ---
-- ================================================================
-- 💬 SUPABASE CHAT FIX (Run in **Chat Project** SQL Editor)
-- ================================================================
-- Target Project ID: bumxgscngzjadyozdpce (from your logs)
-- ================================================================

-- 1. Ensure Messages Table Exists
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    classroom_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT,
    user_avatar TEXT,
    user_role TEXT,
    content TEXT NOT NULL
);

-- 2. Add Columns if Table Was Incomplete
ALTER TABLE messages ADD COLUMN IF NOT EXISTS classroom_id TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_avatar TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_role TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS content TEXT;

-- 3. Fix Column Constraints
ALTER TABLE messages ALTER COLUMN classroom_id SET NOT NULL;
ALTER TABLE messages ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE messages ALTER COLUMN content SET NOT NULL;

-- 4. Enable Security (Start Fresh)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 5. Add Access Policy (Fixes "Permission Denied" / Server Crash)
DROP POLICY IF EXISTS "Allow public access" ON messages;
CREATE POLICY "Allow public access" ON messages FOR ALL USING (true) WITH CHECK (true);

-- 6. Add Performance Indexes
CREATE INDEX IF NOT EXISTS idx_messages_classroom ON messages(classroom_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);


--- File: SUPABASE_CHAT_PRO_V1_MIGRATION.sql ---
-- ================================================================
-- 💬 SUPABASE ADVANCED GROUP CHAT PERMISSIONS (PRO V1)
-- ================================================================
-- Run this in the Supabase SQL Editor for your *CHAT Project*
-- ================================================================

-- 1. Chat group permission policies
ALTER TABLE chat_groups 
ADD COLUMN IF NOT EXISTS send_message_policy TEXT DEFAULT 'all',
ADD COLUMN IF NOT EXISTS edit_info_policy TEXT DEFAULT 'admin_only',
ADD COLUMN IF NOT EXISTS add_member_policy TEXT DEFAULT 'admin_only',
ADD COLUMN IF NOT EXISTS create_poll_policy TEXT DEFAULT 'all',
ADD COLUMN IF NOT EXISTS send_attachments_policy TEXT DEFAULT 'all',
ADD COLUMN IF NOT EXISTS require_message_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS group_type TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_add_roles JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS admin_roles JSONB DEFAULT '[]'::jsonb;

-- 2. Safe policy constraints
ALTER TABLE chat_groups DROP CONSTRAINT IF EXISTS chat_groups_send_message_policy_check;
ALTER TABLE chat_groups ADD CONSTRAINT chat_groups_send_message_policy_check CHECK (send_message_policy IN ('all', 'admin_only', 'admin_faculty'));

ALTER TABLE chat_groups DROP CONSTRAINT IF EXISTS chat_groups_edit_info_policy_check;
ALTER TABLE chat_groups ADD CONSTRAINT chat_groups_edit_info_policy_check CHECK (edit_info_policy IN ('admin_only', 'org_admin_only'));

ALTER TABLE chat_groups DROP CONSTRAINT IF EXISTS chat_groups_add_member_policy_check;
ALTER TABLE chat_groups ADD CONSTRAINT chat_groups_add_member_policy_check CHECK (add_member_policy IN ('admin_only', 'admin_faculty', 'org_admin_only'));

ALTER TABLE chat_groups DROP CONSTRAINT IF EXISTS chat_groups_create_poll_policy_check;
ALTER TABLE chat_groups ADD CONSTRAINT chat_groups_create_poll_policy_check CHECK (create_poll_policy IN ('all', 'admin_only', 'admin_faculty'));

ALTER TABLE chat_groups DROP CONSTRAINT IF EXISTS chat_groups_send_attachments_policy_check;
ALTER TABLE chat_groups ADD CONSTRAINT chat_groups_send_attachments_policy_check CHECK (send_attachments_policy IN ('all', 'admin_only', 'admin_faculty'));

ALTER TABLE chat_groups DROP CONSTRAINT IF EXISTS chat_groups_group_type_check;
ALTER TABLE chat_groups ADD CONSTRAINT chat_groups_group_type_check CHECK (
  group_type IN ('general', 'announcement', 'class', 'department', 'subject', 'exam', 'fees', 'admission', 'faculty', 'parent', 'transport', 'hostel', 'library', 'event')
);

-- 3. Message Status & Features
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pinned_by TEXT,
ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS requires_acknowledgement BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejected_by TEXT,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_status_check;
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_status_check CHECK (status IN ('approved', 'pending', 'rejected'));

-- 4. ERP Acknowledgements Table
CREATE TABLE IF NOT EXISTS chat_message_acknowledgements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_role TEXT,
    acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- 5. Audit Logs Table
CREATE TABLE IF NOT EXISTS chat_group_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
    actor_id TEXT NOT NULL,
    actor_name TEXT,
    action TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5.5 Thread permissions
ALTER TABLE chat_threads
ADD COLUMN IF NOT EXISTS allow_replies BOOLEAN DEFAULT true;

-- 5.6 Advanced Message Metadata
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS is_silent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 6. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_chat_msg_ack_message_id ON chat_message_acknowledgements(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_msg_ack_user_id ON chat_message_acknowledgements(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_status ON chat_messages(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_pinned ON chat_messages(is_pinned);
CREATE INDEX IF NOT EXISTS idx_chat_messages_requires_ack ON chat_messages(requires_acknowledgement);

-- 7. Scheduled Messages Table (Pro V2)
CREATE TABLE IF NOT EXISTS chat_scheduled_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_name TEXT,
    message TEXT NOT NULL,
    reply_to JSONB,
    attachments JSONB DEFAULT '[]'::jsonb,
    scheduled_for TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chat_scheduled_messages DROP CONSTRAINT IF EXISTS chat_scheduled_messages_status_check;
ALTER TABLE chat_scheduled_messages ADD CONSTRAINT chat_scheduled_messages_status_check CHECK (status IN ('pending', 'sent', 'failed', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_chat_sched_msg_thread_id ON chat_scheduled_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_sched_msg_status_date ON chat_scheduled_messages(status, scheduled_for);


--- File: SUPABASE_CLASSROOM_ERP_UPGRADE.sql ---
-- ═══════════════════════════════════════════════════════════════════
-- CLASSGRID — CLASSROOM ERP UPGRADE MIGRATION
-- Run this ONCE in Supabase SQL Editor
-- Adds structured academic fields to classroom memberships
-- ═══════════════════════════════════════════════════════════════════

-- Add the new fields to classroom_memberships
ALTER TABLE classroom_memberships 
ADD COLUMN IF NOT EXISTS division_id UUID REFERENCES divisions(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS subject_name TEXT,
ADD COLUMN IF NOT EXISTS year TEXT,
ADD COLUMN IF NOT EXISTS branch TEXT,
ADD COLUMN IF NOT EXISTS semester INTEGER,
ADD COLUMN IF NOT EXISTS standard TEXT;

-- Create indexes for performance on these new lookup columns
CREATE INDEX IF NOT EXISTS idx_cm_division ON classroom_memberships(division_id);
CREATE INDEX IF NOT EXISTS idx_cm_academic ON classroom_memberships(year, branch, semester);

COMMENT ON COLUMN classroom_memberships.division_id IS 'Links this student/classroom back to the orgs academic structure';


--- File: SUPABASE_CLASSROOM_MIGRATION.sql ---
-- ================================================================
-- CLASSGRID — COMPLETE SUPABASE SETUP (VERIFIED)
-- ================================================================
-- Run this in Supabase SQL Editor (project: hukbgzdreghzidgzwxlj)
--
-- VERIFIED against actual backend code:
-- ✅ classroom_memberships  → used in classroom.routes.js
-- ✅ materials              → used in classroom.routes.js
-- ✅ announcements          → used in classroom.routes.js
-- ✅ quizzes                → used in classroom.routes.js
-- ✅ meetings               → used in zoom.routes.js + calendar.routes.js
-- ✅ notifications          → used in classroom.routes.js
-- ✅ material_summaries     → used in classroom.routes.js
-- ✅ content_comments       → used in comments.routes.js
--
-- ❌ SKIPPED (these live in MongoDB, NOT Supabase):
--    - attendance_sessions  → MongoDB: AttendanceSession model
--    - attendance_records   → MongoDB: AttendanceRecord model
--    - classroom_settings   → MongoDB: Classroom.settings embedded doc
-- ================================================================


-- ════════════════════════════════════════════════
-- 1. CORE TABLES
-- ════════════════════════════════════════════════

-- ── CLASSROOM MEMBERSHIPS ──
CREATE TABLE IF NOT EXISTS classroom_memberships (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    classroom_id    TEXT NOT NULL,
    student_id      TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected')),
    request_message TEXT,
    joined_at       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now(),

    UNIQUE (classroom_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_cm_classroom   ON classroom_memberships(classroom_id);
CREATE INDEX IF NOT EXISTS idx_cm_student     ON classroom_memberships(student_id);
CREATE INDEX IF NOT EXISTS idx_cm_status      ON classroom_memberships(classroom_id, status);


-- ── MATERIALS ──
CREATE TABLE IF NOT EXISTS materials (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title           TEXT,
    subject_slug    TEXT,
    file_url        TEXT,
    uploaded_by     TEXT,
    type            TEXT,
    classroom_id    TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_materials_classroom          ON materials(classroom_id);
CREATE INDEX IF NOT EXISTS idx_materials_classroom_subject   ON materials(classroom_id, subject_slug);


-- ── ANNOUNCEMENTS ──
CREATE TABLE IF NOT EXISTS announcements (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title           TEXT,
    message         TEXT,
    content         TEXT,
    subject_slug    TEXT,
    posted_by       TEXT,
    tags            TEXT[] DEFAULT '{"General"}',
    classroom_id    TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_classroom          ON announcements(classroom_id);
CREATE INDEX IF NOT EXISTS idx_announcements_classroom_subject   ON announcements(classroom_id, subject_slug);


-- ── QUIZZES ──
CREATE TABLE IF NOT EXISTS quizzes (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title           TEXT,
    subject_slug    TEXT,
    quiz_url        TEXT,
    provider        TEXT DEFAULT 'Google Forms',
    classroom_id    TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_classroom          ON quizzes(classroom_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_classroom_subject   ON quizzes(classroom_id, subject_slug);


-- ── MEETINGS (Zoom + Google Meet) ──
CREATE TABLE IF NOT EXISTS meetings (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    classroom_id        TEXT NOT NULL,
    teacher_id          TEXT NOT NULL,
    provider            TEXT NOT NULL CHECK (provider IN ('zoom', 'google_meet')),
    topic               TEXT,
    join_url            TEXT,
    start_time          TIMESTAMPTZ NOT NULL,
    duration            INTEGER DEFAULT 60,
    calendar_event_id   TEXT,
    status              TEXT DEFAULT 'upcoming'
                            CHECK (status IN ('upcoming', 'live', 'completed', 'cancelled')),
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meetings_classroom   ON meetings(classroom_id);
CREATE INDEX IF NOT EXISTS idx_meetings_start       ON meetings(classroom_id, start_time);


-- ── NOTIFICATIONS ──
CREATE TABLE IF NOT EXISTS notifications (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    recipient_id    TEXT NOT NULL,
    type            TEXT DEFAULT 'system',
    title           TEXT,
    message         TEXT,
    link            TEXT,
    related_id      TEXT,
    classroom_id    TEXT,
    is_read         BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_recipient  ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notif_read       ON notifications(recipient_id, is_read);


-- ── CONTENT COMMENTS (used by comments.routes.js) ──
CREATE TABLE IF NOT EXISTS content_comments (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    content_id      TEXT NOT NULL,
    classroom_id    TEXT,
    user_id         TEXT NOT NULL,
    user_name       TEXT,
    user_role       TEXT,
    comment         TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_content ON content_comments(content_id);
CREATE INDEX IF NOT EXISTS idx_comments_user    ON content_comments(user_id);


-- ── MATERIAL SUMMARIES (AI cache) ──
CREATE TABLE IF NOT EXISTS material_summaries (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    material_id     TEXT NOT NULL UNIQUE,
    classroom_id    TEXT,
    summary         TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_matsummary_material ON material_summaries(material_id);


-- ════════════════════════════════════════════════
-- 2. TRIGGER — auto-update updated_at
-- ════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_matsummary_updated ON material_summaries;
CREATE TRIGGER trg_matsummary_updated
BEFORE UPDATE ON material_summaries
FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ════════════════════════════════════════════════
-- 3. ROW LEVEL SECURITY (RLS)
-- ════════════════════════════════════════════════
-- Backend uses SERVICE_ROLE_KEY (bypasses RLS).
-- These policies are a safety net.

ALTER TABLE classroom_memberships  ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials              ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements          ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings               ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_comments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_summaries     ENABLE ROW LEVEL SECURITY;

-- Allow full access for service_role (your backend)
DROP POLICY IF EXISTS "service_all_classroom_memberships" ON classroom_memberships;
CREATE POLICY "service_all_classroom_memberships" ON classroom_memberships FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_all_materials" ON materials;
CREATE POLICY "service_all_materials" ON materials FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_all_announcements" ON announcements;
CREATE POLICY "service_all_announcements" ON announcements FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_all_quizzes" ON quizzes;
CREATE POLICY "service_all_quizzes" ON quizzes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_all_meetings" ON meetings;
CREATE POLICY "service_all_meetings" ON meetings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_all_notifications" ON notifications;
CREATE POLICY "service_all_notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_all_content_comments" ON content_comments;
CREATE POLICY "service_all_content_comments" ON content_comments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_all_material_summaries" ON material_summaries;
CREATE POLICY "service_all_material_summaries" ON material_summaries FOR ALL USING (true) WITH CHECK (true);


-- ════════════════════════════════════════════════
-- 4. STORAGE BUCKETS
-- ════════════════════════════════════════════════

-- classroom-files (material uploads)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'classroom-files', 'classroom-files', true, 52428800,
    ARRAY[
        'application/pdf',
        'image/png','image/jpeg','image/gif','image/webp','image/svg+xml',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain','text/csv',
        'application/zip',
        'video/mp4','video/webm',
        'audio/mpeg','audio/wav'
    ]
) ON CONFLICT (id) DO NOTHING;

-- notes-files (student notes)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'notes-files', 'notes-files', true, 52428800,
    ARRAY[
        'application/pdf',
        'image/png','image/jpeg','image/gif','image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ]
) ON CONFLICT (id) DO NOTHING;

-- assignment-files
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('assignment-files', 'assignment-files', true, 52428800)
ON CONFLICT (id) DO NOTHING;

-- student-submissions
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('student-submissions', 'student-submissions', true, 52428800)
ON CONFLICT (id) DO NOTHING;


-- ════════════════════════════════════════════════
-- 5. STORAGE POLICIES
-- ════════════════════════════════════════════════

-- Public read on all buckets
CREATE POLICY "Public read classroom-files" ON storage.objects
    FOR SELECT USING (bucket_id = 'classroom-files');

CREATE POLICY "Public read notes-files" ON storage.objects
    FOR SELECT USING (bucket_id = 'notes-files');

CREATE POLICY "Public read assignment-files" ON storage.objects
    FOR SELECT USING (bucket_id = 'assignment-files');

CREATE POLICY "Public read student-submissions" ON storage.objects
    FOR SELECT USING (bucket_id = 'student-submissions');

-- Service role insert/delete on all buckets
CREATE POLICY "Upload classroom-files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'classroom-files');

CREATE POLICY "Delete classroom-files" ON storage.objects
    FOR DELETE USING (bucket_id = 'classroom-files');

CREATE POLICY "Upload notes-files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'notes-files');

CREATE POLICY "Delete notes-files" ON storage.objects
    FOR DELETE USING (bucket_id = 'notes-files');

CREATE POLICY "Upload assignment-files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'assignment-files');

CREATE POLICY "Delete assignment-files" ON storage.objects
    FOR DELETE USING (bucket_id = 'assignment-files');

CREATE POLICY "Upload student-submissions" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'student-submissions');

CREATE POLICY "Delete student-submissions" ON storage.objects
    FOR DELETE USING (bucket_id = 'student-submissions');


-- ════════════════════════════════════════════════
-- ✅ SETUP COMPLETE
-- ════════════════════════════════════════════════
--
-- SUPABASE TABLES (8):
--   classroom_memberships, materials, announcements,
--   quizzes, meetings, notifications,
--   content_comments, material_summaries
--
-- STORAGE BUCKETS (4):
--   classroom-files, notes-files,
--   assignment-files, student-submissions
--
-- MONGODB (NOT in Supabase):
--   Classroom (with settings), AttendanceSession,
--   AttendanceRecord, User, Notification (Mongoose),
--   ClassroomMembership (Mongoose), AdminAuditLog
--
-- ════════════════════════════════════════════════


--- File: SUPABASE_COMPLETE_ONBOARDING_MIGRATION.sql ---
-- ═══════════════════════════════════════════════════════════════════
-- CLASSGRID — COMPLETE ONBOARDING SQL MIGRATION
-- Run this ONCE in Supabase SQL Editor
-- Covers: Divisions upgrade + Student Profile tables + RLS
-- ═══════════════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PART 1: DIVISIONS TABLE UPGRADE
-- (Division = Single Source of Truth)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE divisions ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'college';
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS course TEXT;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS branch TEXT;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS division_name TEXT;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS class_teacher_id TEXT;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS assistant_teacher_id TEXT;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS subjects JSONB DEFAULT '[]'::jsonb;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS sem_start_date DATE;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS sem_end_date DATE;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS sem2_start_date DATE;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS sem2_end_date DATE;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS academic_year_start DATE;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS academic_year_end DATE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_divisions_class_teacher 
    ON divisions(class_teacher_id) 
    WHERE class_teacher_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_divisions_org_type 
    ON divisions(org_id, type);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PART 2: STUDENTS TABLE — Category + Admission
-- (Step 9 of Onboarding)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE students ADD COLUMN IF NOT EXISTS admission_type TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS category TEXT;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PART 3: FAMILY INFO TABLE
-- (Step 5 of Onboarding)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS student_family_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL UNIQUE,
    father_name TEXT,
    mother_name TEXT,
    parent_contact TEXT,
    emergency_contact TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE student_family_info ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own family info" ON student_family_info;
    DROP POLICY IF EXISTS "Users can insert their own family info" ON student_family_info;
    DROP POLICY IF EXISTS "Users can update their own family info" ON student_family_info;
    DROP POLICY IF EXISTS "Service role full access family" ON student_family_info;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Users can view their own family info" 
    ON student_family_info FOR SELECT USING (true);
CREATE POLICY "Users can insert their own family info" 
    ON student_family_info FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own family info" 
    ON student_family_info FOR UPDATE USING (true);
CREATE POLICY "Service role full access family" 
    ON student_family_info FOR ALL USING (true);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PART 4: PAST QUALIFICATIONS TABLE
-- (Step 4 of Onboarding — 10th/12th)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS student_past_qualifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    qual_type TEXT NOT NULL,
    board TEXT,
    passing_year TEXT,
    marks TEXT,
    stream TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, qual_type)
);

ALTER TABLE student_past_qualifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own past qualifications" ON student_past_qualifications;
    DROP POLICY IF EXISTS "Users can insert their own past qualifications" ON student_past_qualifications;
    DROP POLICY IF EXISTS "Users can update their own past qualifications" ON student_past_qualifications;
    DROP POLICY IF EXISTS "Users can delete their own past qualifications" ON student_past_qualifications;
    DROP POLICY IF EXISTS "Service role full access qualifications" ON student_past_qualifications;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Users can view their own past qualifications" 
    ON student_past_qualifications FOR SELECT USING (true);
CREATE POLICY "Users can insert their own past qualifications" 
    ON student_past_qualifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own past qualifications" 
    ON student_past_qualifications FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own past qualifications" 
    ON student_past_qualifications FOR DELETE USING (true);
CREATE POLICY "Service role full access qualifications" 
    ON student_past_qualifications FOR ALL USING (true);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PART 5: DOCUMENTS TABLE
-- (Step 7 of Onboarding — SSC/HSC/Leaving Certs)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS student_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    doc_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, doc_type)
);

ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own documents" ON student_documents;
    DROP POLICY IF EXISTS "Users can insert their own documents" ON student_documents;
    DROP POLICY IF EXISTS "Users can update their own documents" ON student_documents;
    DROP POLICY IF EXISTS "Users can delete their own documents" ON student_documents;
    DROP POLICY IF EXISTS "Service role full access documents" ON student_documents;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Users can view their own documents" 
    ON student_documents FOR SELECT USING (true);
CREATE POLICY "Users can insert their own documents" 
    ON student_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own documents" 
    ON student_documents FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own documents" 
    ON student_documents FOR DELETE USING (true);
CREATE POLICY "Service role full access documents" 
    ON student_documents FOR ALL USING (true);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PART 6: AUTO-UPDATE TRIGGERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_student_family_info_modtime ON student_family_info;
CREATE TRIGGER update_student_family_info_modtime
BEFORE UPDATE ON student_family_info
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_student_past_qualifications_modtime ON student_past_qualifications;
CREATE TRIGGER update_student_past_qualifications_modtime
BEFORE UPDATE ON student_past_qualifications
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_student_documents_modtime ON student_documents;
CREATE TRIGGER update_student_documents_modtime
BEFORE UPDATE ON student_documents
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- DONE! All tables ready for 9-step onboarding.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


--- File: SUPABASE_COURSE_MODULE_MIGRATION.sql ---
-- ═══════════════════════════════════════════════════════════════════
-- CLASSGRID — COURSE / CURRICULUM MODULE MIGRATION
-- Run this ONCE in Supabase SQL Editor
-- Creates: courses, course_subjects tables
-- ═══════════════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. COURSES TABLE (Top-level grouping)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id TEXT NOT NULL,
    name TEXT NOT NULL,               -- e.g. "FY", "SY", "Class 10", "B.Tech CS"
    type TEXT NOT NULL DEFAULT 'COLLEGE',  -- "SCHOOL" / "COLLEGE"
    description TEXT,
    year TEXT,                        -- College: "First Year", "Second Year"
    standard TEXT,                    -- School: "10th", "12th"
    course_name TEXT,                 -- College: "B.E", "B.Tech", "MBA"
    branch TEXT,                      -- College: "Computer Science", "IT"
    total_semesters INTEGER DEFAULT 2,-- College: total semesters in this course
    status TEXT DEFAULT 'active',     -- active / archived
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(org_id, name)
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. COURSE SUBJECTS TABLE (Per-semester subjects)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS course_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    org_id TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    subject_code TEXT,                -- e.g. "CS101", "MATH201"
    semester INTEGER,                 -- College: which semester (1,2,3...) | School: NULL
    credit_hours INTEGER,             -- optional
    subject_type TEXT DEFAULT 'theory', -- theory / practical / elective
    syllabus_url TEXT,                -- PDF/file URL
    resources JSONB DEFAULT '[]'::jsonb, -- [{ name, url, type }]
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(course_id, subject_name, semester)
);

-- Unique index for subjects where semester can be NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_course_subjects_unique
ON course_subjects (course_id, subject_name, COALESCE(semester, 0));

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. INDEXES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE INDEX IF NOT EXISTS idx_courses_org ON courses(org_id);
CREATE INDEX IF NOT EXISTS idx_course_subjects_course ON course_subjects(course_id);
CREATE INDEX IF NOT EXISTS idx_course_subjects_org ON course_subjects(org_id);
CREATE INDEX IF NOT EXISTS idx_course_subjects_semester ON course_subjects(course_id, semester);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. ROW LEVEL SECURITY
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access to courses" ON courses;
CREATE POLICY "Allow full access to courses" ON courses FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow full access to course_subjects" ON course_subjects;
CREATE POLICY "Allow full access to course_subjects" ON course_subjects FOR ALL USING (true);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5. AUTO-UPDATE TRIGGER
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DROP TRIGGER IF EXISTS update_courses_modtime ON courses;
CREATE TRIGGER update_courses_modtime
BEFORE UPDATE ON courses
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_course_subjects_modtime ON course_subjects;
CREATE TRIGGER update_course_subjects_modtime
BEFORE UPDATE ON course_subjects
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 6. FACULTY ASSIGNMENTS TABLE (WHO teaches WHAT, WHERE)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS faculty_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL,
    teacher_id TEXT NOT NULL,                    -- MongoDB user._id reference
    subject_id UUID REFERENCES course_subjects(id) ON DELETE CASCADE,  -- NULL for class_teacher
    division_id UUID,                            -- References divisions table
    role TEXT NOT NULL CHECK (role IN ('class_teacher', 'subject_teacher', 'assistant_teacher')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Prevent exact duplicate assignments (same teacher, subject, division, role)
    UNIQUE(teacher_id, subject_id, division_id, role)
);

-- 🔥 PARTIAL UNIQUE INDEX: Only ONE class_teacher per division (CRITICAL)
CREATE UNIQUE INDEX IF NOT EXISTS one_class_teacher_per_division
ON faculty_assignments (division_id)
WHERE role = 'class_teacher';

-- Performance indexes (needed at scale)
CREATE INDEX IF NOT EXISTS idx_faculty_division ON faculty_assignments(division_id);
CREATE INDEX IF NOT EXISTS idx_faculty_teacher ON faculty_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_faculty_subject ON faculty_assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_faculty_org ON faculty_assignments(org_id);

-- RLS
ALTER TABLE faculty_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_faculty_assignments" ON faculty_assignments;
CREATE POLICY "service_role_faculty_assignments" ON faculty_assignments
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Auto-update trigger
DROP TRIGGER IF EXISTS update_faculty_assignments_modtime ON faculty_assignments;
CREATE TRIGGER update_faculty_assignments_modtime
BEFORE UPDATE ON faculty_assignments
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- DONE! Course Module + Faculty Assignments ready.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


--- File: SUPABASE_DEVICE_TOKENS_MIGRATION.sql ---
-- ══════════════════════════════════════════════════════════════
--  DEVICE TOKENS TABLE — FCM Push Notification Registration
--  Run this in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

-- This table stores Firebase Cloud Messaging tokens for each
-- user's device. When a student, faculty, or admin installs the
-- Classgrid Android app, Kotlin fetches their unique FCM token
-- and React sends it here via POST /api/push/register-device.

CREATE TABLE IF NOT EXISTS device_tokens (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       TEXT NOT NULL,                          -- MongoDB user _id
  fcm_token     TEXT NOT NULL UNIQUE,                   -- Firebase device token
  platform      TEXT NOT NULL DEFAULT 'android',        -- android | ios | web (future)
  app_role      TEXT NOT NULL DEFAULT 'student',        -- student | faculty | admin
  org_id        TEXT,                                   -- Organization ID for role-based targeting
  last_active   TIMESTAMPTZ DEFAULT NOW(),              -- Last time token was refreshed
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by user (when sending to specific users)
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id
  ON device_tokens(user_id);

-- Index for role-based broadcast within an org
CREATE INDEX IF NOT EXISTS idx_device_tokens_org_role
  ON device_tokens(org_id, app_role);

-- Index for token uniqueness enforcement and cleanup
CREATE INDEX IF NOT EXISTS idx_device_tokens_fcm_token
  ON device_tokens(fcm_token);

-- ══════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════

ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own tokens
CREATE POLICY "Users can view their own tokens"
  ON device_tokens FOR SELECT
  USING (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can insert their own tokens"
  ON device_tokens FOR INSERT
  WITH CHECK (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can delete their own tokens"
  ON device_tokens FOR DELETE
  USING (user_id = auth.uid()::TEXT);

-- Service role (backend) can do everything
-- (This is automatic when using the service_role key from Node.js)

-- ══════════════════════════════════════════════════════════════
--  AUTO-CLEANUP: Remove stale tokens older than 60 days
--  Run this as a Supabase scheduled function or cron job
-- ══════════════════════════════════════════════════════════════

-- DELETE FROM device_tokens
-- WHERE last_active < NOW() - INTERVAL '60 days';


--- File: SUPABASE_DIVISION_UPGRADE.sql ---
-- ═══════════════════════════════════════════════════════════
-- DIVISION-CENTRIC ARCHITECTURE — Extend divisions table
-- ═══════════════════════════════════════════════════════════

-- 1. Add new columns to existing divisions table
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'college';
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS course TEXT;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS branch TEXT;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS division_name TEXT;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS class_teacher_id TEXT;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS assistant_teacher_id TEXT;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS subjects JSONB DEFAULT '[]'::jsonb;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS sem_start_date DATE;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS sem_end_date DATE;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS sem2_start_date DATE;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS sem2_end_date DATE;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS academic_year_start DATE;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS academic_year_end DATE;

-- 2. Add admission_type and category to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS admission_type TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS category TEXT;

-- 3. Index for class_teacher_id lookups
CREATE INDEX IF NOT EXISTS idx_divisions_class_teacher 
    ON divisions(class_teacher_id) 
    WHERE class_teacher_id IS NOT NULL;

-- 4. Index for org_id + type for filtered queries
CREATE INDEX IF NOT EXISTS idx_divisions_org_type 
    ON divisions(org_id, type);


--- File: SUPABASE_EVENTS_MIGRATION.sql ---
-- ═══════════════════════════════════════════════════════════════════
-- CLASSGRID — EVENT MODULE (ACADEMIC CALENDAR) MIGRATION
-- Run this ONCE in Supabase SQL Editor
-- Creates: org_events table + V2/V3 enhancements
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS org_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL,
    created_by TEXT,                    -- MongoDB user._id
    updated_by TEXT,                    -- MongoDB user._id (V3 versioning track)
    
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('academic', 'exam', 'test', 'holiday', 'event')),
    description TEXT,
    
    -- V3 Timezone safety upgrade (TIMESTAMPTZ instead of DATE)
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    
    priority INTEGER DEFAULT 1,
    recurrence JSONB,                   -- {"freq": "WEEKLY", "until": "2024-12-31"}
    
    -- V3 Versioning
    version INTEGER DEFAULT 1,
    
    -- Scoped Fields
    year_id UUID,
    department TEXT,
    division_id UUID,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Safely add new columns and alter types if table was created previously
DO $$
BEGIN
    BEGIN
        ALTER TABLE org_events ADD COLUMN priority INTEGER DEFAULT 1;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE org_events ADD COLUMN recurrence JSONB;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE org_events ADD COLUMN division_id UUID;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE org_events ADD COLUMN version INTEGER DEFAULT 1;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE org_events ADD COLUMN updated_by TEXT;
    EXCEPTION WHEN duplicate_column THEN END;
END $$;

-- Alter dates to TIMESTAMPTZ gracefully
ALTER TABLE org_events ALTER COLUMN start_date TYPE TIMESTAMPTZ USING start_date::TIMESTAMPTZ;
ALTER TABLE org_events ALTER COLUMN end_date TYPE TIMESTAMPTZ USING end_date::TIMESTAMPTZ;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_events_org ON org_events(org_id);
CREATE INDEX IF NOT EXISTS idx_org_events_date ON org_events(start_date);
CREATE INDEX IF NOT EXISTS idx_org_events_year ON org_events(year_id);
CREATE INDEX IF NOT EXISTS idx_org_events_dept ON org_events(department);
CREATE INDEX IF NOT EXISTS idx_org_events_division ON org_events(division_id);
CREATE INDEX IF NOT EXISTS idx_org_events_priority ON org_events(priority DESC);

-- RLS
ALTER TABLE org_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_org_events" ON org_events;
CREATE POLICY "service_role_org_events" ON org_events
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Auto Update
DROP TRIGGER IF EXISTS update_org_events_modtime ON org_events;
CREATE TRIGGER update_org_events_modtime
BEFORE UPDATE ON org_events
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Audit trigger function for versioning
CREATE OR REPLACE FUNCTION increment_event_version()
RETURNS TRIGGER AS $$
BEGIN
   IF NEW.id = OLD.id AND (
       NEW.title <> OLD.title OR 
       NEW.type <> OLD.type OR 
       NEW.start_date <> OLD.start_date OR 
       NEW.end_date IS DISTINCT FROM OLD.end_date
   ) THEN
       NEW.version = OLD.version + 1;
   END IF;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_org_events_version ON org_events;
CREATE TRIGGER update_org_events_version
BEFORE UPDATE ON org_events
FOR EACH ROW EXECUTE PROCEDURE increment_event_version();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- DONE! Org Events table ready.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


--- File: SUPABASE_EXAMINATIONS_MIGRATION.sql ---
-- =========================================================================
-- CLASSGRID EXAMINATION MODULE MIGRATION (SAFE RE-RUN)
-- Run securely in Supabase SQL Editor
-- Uses DROP IF EXISTS + CREATE for safe re-execution
-- =========================================================================

-- ─── 1. EXAMS TABLE ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  name TEXT NOT NULL,                             -- e.g., "Semester 1 Finals"
  type TEXT NOT NULL CHECK (type IN ('school', 'college')),
  academic_year_id UUID,
  semester INT,
  date_range_start DATE,
  date_range_end DATE,
  exam_fee_amount DECIMAL(10,2) DEFAULT 0,        -- 0 = no fee (school default)
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exams_org ON exams(org_id);
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_exams" ON exams;
CREATE POLICY "service_role_exams" ON exams
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');


-- ─── 2. EXAM TIMETABLES (Division-Based Assignment) ──────────────────
CREATE TABLE IF NOT EXISTS exam_timetables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL,
  division_id UUID,                               -- Division-based ✅ (exact mapping)
  pdf_url TEXT,                                   -- Original uploaded PDF backup
  structured_data JSONB,                          -- AI Extracted: [{date, day, subject, time}]
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Safe unique constraint (drop first if exists from previous run)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'exam_timetables_exam_id_division_id_key'
  ) THEN
    ALTER TABLE exam_timetables ADD CONSTRAINT exam_timetables_exam_id_division_id_key UNIQUE (exam_id, division_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_exam_timetables_org ON exam_timetables(org_id);
CREATE INDEX IF NOT EXISTS idx_exam_timetables_division ON exam_timetables(division_id);
ALTER TABLE exam_timetables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_exam_timetables" ON exam_timetables;
CREATE POLICY "service_role_exam_timetables" ON exam_timetables
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');


-- ─── 3. EXAM PAYMENTS (College Only, Optional) ───────────────────────
CREATE TABLE IF NOT EXISTS exam_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  org_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  payment_id TEXT,                                -- Gateway Transaction ID (Razorpay)
  paid_at TIMESTAMPTZ,                            -- Timestamp when payment confirmed
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Safe unique constraint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'exam_payments_exam_id_user_id_key'
  ) THEN
    ALTER TABLE exam_payments ADD CONSTRAINT exam_payments_exam_id_user_id_key UNIQUE (exam_id, user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_exam_payments_org ON exam_payments(org_id);
CREATE INDEX IF NOT EXISTS idx_exam_payments_user ON exam_payments(user_id);
ALTER TABLE exam_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_exam_payments" ON exam_payments;
CREATE POLICY "service_role_exam_payments" ON exam_payments
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Done ✅ Safe to re-run anytime.


--- File: SUPABASE_FACULTY_ROLES_MIGRATION.sql ---
-- =========================================================================
-- CLASSGRID FACULTY ROLES REFACTOR MIGRATION
-- Adds strict constraints for roles and a subject column.
-- Run this in your Supabase SQL Editor
-- =========================================================================

-- 1. Add subject column
ALTER TABLE faculty_divisions
  ADD COLUMN IF NOT EXISTS subject TEXT;

-- 2. Clean up any existing duplicate roles just in case
-- We remove older duplicates keeping only the most recently assigned ones
DELETE FROM faculty_divisions
WHERE id NOT IN (
  SELECT min(id)
  FROM faculty_divisions
  GROUP BY faculty_id, division_id, role, coalesce(subject, '')
);

-- 3. Replace the old constraint if any, and add the new one
-- First, lets gracefully drop variations of possible past constraints
ALTER TABLE faculty_divisions DROP CONSTRAINT IF EXISTS faculty_divisions_faculty_id_division_id_role_key;
ALTER TABLE faculty_divisions DROP CONSTRAINT IF EXISTS faculty_divisions_unique_assignment;

-- Now add the strict comprehensive unique constraint
-- A faculty member cannot have the exact same role in the exact same division,
-- unless it is an explicitly different subject (for Subject Teachers).
CREATE UNIQUE INDEX IF NOT EXISTS faculty_role_unique_idx
ON faculty_divisions (faculty_id, division_id, role, coalesce(subject, ''));

-- Note: The trigger trg_enforce_single_class_teacher is already active 
-- and handles replacing the strictly 1 Class Teacher.

-- BOOM. Done.


--- File: SUPABASE_FEEDBACK_MIGRATION.sql ---
-- ============================================================
-- CLASSGRID — PREMIUM FEEDBACK MODULE
-- AI-Powered Qualitative Feedback System
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. FEEDBACK FORMS (Admin/Teacher creates)
CREATE TABLE IF NOT EXISTS feedback_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_type TEXT NOT NULL DEFAULT 'teacher' CHECK (target_type IN ('teacher', 'organization')),
    target_teacher_id TEXT,              -- MongoDB user _id of the teacher
    target_teacher_name TEXT,            -- Cached teacher name
    subject_name TEXT,                   -- Subject name (cached for display)
    classroom_id TEXT,                   -- MongoDB classroom _id
    applicability TEXT NOT NULL DEFAULT 'all' CHECK (applicability IN ('all', 'class', 'division')),
    division_id TEXT,                    -- division_id if scoped to a division
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
    is_active BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'archived')),
    allow_comments BOOLEAN DEFAULT true,
    anonymous BOOLEAN DEFAULT true,
    created_by TEXT NOT NULL,            -- MongoDB user _id
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FEEDBACK QUESTIONS
CREATE TABLE IF NOT EXISTS feedback_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES feedback_forms(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT DEFAULT 'qualitative' CHECK (question_type IN ('qualitative', 'rating', 'text')),
    display_order INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT true,
    options JSONB DEFAULT '["Good", "Better", "Best", "Excellent"]',
    ratings_map JSONB DEFAULT '{"Good": 2, "Better": 3, "Best": 4, "Excellent": 5}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. FEEDBACK RESPONSES (one per question per student)
CREATE TABLE IF NOT EXISTS feedback_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES feedback_forms(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES feedback_questions(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,            -- MongoDB user _id
    org_id TEXT NOT NULL,
    response_value TEXT,                 -- 'Good', 'Better', 'Best', 'Excellent'
    rating_value INTEGER,               -- Mapped: Good=2, Better=3, Best=4, Excellent=5
    comment TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent duplicate submissions per question per student
CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_response_unique 
    ON feedback_responses(form_id, question_id, student_id);

-- 4. FEEDBACK SUBMISSIONS (track completion per student per form)
CREATE TABLE IF NOT EXISTS feedback_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES feedback_forms(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    org_id TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT true,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_submission_unique 
    ON feedback_submissions(form_id, student_id);

-- 5. FEEDBACK ANALYTICS (aggregated + AI insights)
CREATE TABLE IF NOT EXISTS feedback_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES feedback_forms(id) ON DELETE CASCADE,
    teacher_id TEXT,
    org_id TEXT NOT NULL,
    avg_rating FLOAT,
    total_responses INTEGER DEFAULT 0,
    participation_rate FLOAT DEFAULT 0,
    question_breakdown JSONB DEFAULT '{}',
    ai_insights JSONB,                  -- { strengths: [], weaknesses: [], suggestions: [] }
    performance_tag TEXT CHECK (performance_tag IN ('excellent', 'strong', 'average', 'needs_improvement')),
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_analytics_unique 
    ON feedback_analytics(form_id, teacher_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fb_forms_org ON feedback_forms(org_id);
CREATE INDEX IF NOT EXISTS idx_fb_forms_status ON feedback_forms(status);
CREATE INDEX IF NOT EXISTS idx_fb_forms_teacher ON feedback_forms(target_teacher_id);
CREATE INDEX IF NOT EXISTS idx_fb_questions_form ON feedback_questions(form_id);
CREATE INDEX IF NOT EXISTS idx_fb_responses_form ON feedback_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_fb_responses_student ON feedback_responses(student_id);
CREATE INDEX IF NOT EXISTS idx_fb_submissions_form ON feedback_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_fb_analytics_form ON feedback_analytics(form_id);

-- RLS
ALTER TABLE feedback_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_analytics ENABLE ROW LEVEL SECURITY;

-- Open policies (server uses service key)
DO $$
BEGIN
  DROP POLICY IF EXISTS "fb_forms_all" ON feedback_forms;
  DROP POLICY IF EXISTS "fb_questions_all" ON feedback_questions;
  DROP POLICY IF EXISTS "fb_responses_all" ON feedback_responses;
  DROP POLICY IF EXISTS "fb_submissions_all" ON feedback_submissions;
  DROP POLICY IF EXISTS "fb_analytics_all" ON feedback_analytics;
END $$;

CREATE POLICY "fb_forms_all" ON feedback_forms USING (true) WITH CHECK (true);
CREATE POLICY "fb_questions_all" ON feedback_questions USING (true) WITH CHECK (true);
CREATE POLICY "fb_responses_all" ON feedback_responses USING (true) WITH CHECK (true);
CREATE POLICY "fb_submissions_all" ON feedback_submissions USING (true) WITH CHECK (true);
CREATE POLICY "fb_analytics_all" ON feedback_analytics USING (true) WITH CHECK (true);


--- File: SUPABASE_FEES_MIGRATION.sql ---
-- ==============================================================================
-- FEES MANAGEMENT MODULE MIGRATION
-- Description: Fee structures, student fee records, and payment tracking
-- ==============================================================================

-- 1. Fee Structures (Admin-defined templates)
CREATE TABLE IF NOT EXISTS fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    name TEXT NOT NULL,                          -- e.g. "FY B.Tech 2025-26 Sem 1"
    academic_year TEXT,                           -- e.g. "2025-26"
    division_id UUID,                            -- Nullable = applies to all divisions
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    due_date DATE,                               -- Overall due date
    late_fine_per_day NUMERIC(8,2) DEFAULT 0,    -- Optional late fine
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fee_struct_org ON fee_structures(org_id);
CREATE INDEX IF NOT EXISTS idx_fee_struct_div ON fee_structures(division_id);

-- 2. Fee Components (Breakdown within a structure)
CREATE TABLE IF NOT EXISTS fee_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    structure_id UUID NOT NULL REFERENCES fee_structures(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                           -- e.g. "Tuition", "Exam", "Library"
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fee_comp_struct ON fee_components(structure_id);

-- 3. Student Fee Records (Generated per student from structures)
CREATE TABLE IF NOT EXISTS student_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    student_id VARCHAR(255) NOT NULL,             -- Mongo User ID
    structure_id UUID NOT NULL REFERENCES fee_structures(id) ON DELETE CASCADE,
    division_id UUID,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    pending_amount NUMERIC(12,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    due_date DATE,
    status TEXT DEFAULT 'unpaid' CHECK (status IN ('paid', 'partial', 'unpaid', 'overdue')),
    is_blocked BOOLEAN DEFAULT FALSE,             -- Block library/results if unpaid
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- One fee record per student per structure
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_fee_unique
    ON student_fees (student_id, structure_id);

CREATE INDEX IF NOT EXISTS idx_sf_org ON student_fees(org_id);
CREATE INDEX IF NOT EXISTS idx_sf_student ON student_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_sf_status ON student_fees(status);
CREATE INDEX IF NOT EXISTS idx_sf_division ON student_fees(division_id);

-- 4. Fee Payments (Transaction log)
CREATE TABLE IF NOT EXISTS fee_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    student_fee_id UUID NOT NULL REFERENCES student_fees(id) ON DELETE CASCADE,
    student_id VARCHAR(255) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'upi', 'bank_transfer', 'cheque', 'online', 'other')),
    reference_number TEXT,                        -- UTR / Cheque no / Receipt no
    notes TEXT,
    recorded_by VARCHAR(255),                     -- Admin/Teacher who recorded
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fp_org ON fee_payments(org_id);
CREATE INDEX IF NOT EXISTS idx_fp_student ON fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_fp_student_fee ON fee_payments(student_fee_id);

-- Auto-update trigger for student_fees
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_student_fees_modtime') THEN
        CREATE FUNCTION update_student_fees_modtime()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
    END IF;
END
$$;

CREATE TRIGGER update_student_fees_modtime_trigger
    BEFORE UPDATE ON student_fees
    FOR EACH ROW EXECUTE FUNCTION update_student_fees_modtime();

-- Auto-update trigger for fee_structures
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_fee_struct_modtime') THEN
        CREATE FUNCTION update_fee_struct_modtime()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
    END IF;
END
$$;

CREATE TRIGGER update_fee_struct_modtime_trigger
    BEFORE UPDATE ON fee_structures
    FOR EACH ROW EXECUTE FUNCTION update_fee_struct_modtime();


--- File: SUPABASE_FEES_RAZORPAY_UPGRADE.sql ---
-- ==============================================================================
-- RAZORPAY UPGRADE FOR FEES MODULE
-- Description: Adds payment mode toggle and Razorpay tracking fields
-- Run AFTER SUPABASE_FEES_MIGRATION.sql
-- ==============================================================================

-- 1. Add payment_mode to fee_structures (admin chooses per structure)
ALTER TABLE fee_structures
    ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT 'manual'
    CHECK (payment_mode IN ('manual', 'razorpay', 'both'));

-- 2. Add Razorpay tracking to fee_payments
ALTER TABLE fee_payments
    ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
    ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
    ADD COLUMN IF NOT EXISTS razorpay_signature TEXT,
    ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'success'
    CHECK (payment_status IN ('success', 'pending', 'failed'));

-- Index for quick lookup by razorpay IDs
CREATE INDEX IF NOT EXISTS idx_fp_razorpay_order ON fee_payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_fp_razorpay_payment ON fee_payments(razorpay_payment_id);


--- File: SUPABASE_FIX_CLASSROOM_MESSAGES.sql ---
-- ================================================================
-- 🚀 FIX: ALLOW MESSAGE LOADING (Refresh Issue)
-- ================================================================
-- Run this in the Supabase SQL Editor for your *Chat Project*
-- ================================================================

-- 1. Ensure Table Exists (referencing correct table name)
CREATE TABLE IF NOT EXISTS classroom_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    classroom_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    user_avatar TEXT,
    message TEXT NOT NULL
);

-- 2. Enable RLS (Security)
ALTER TABLE classroom_messages ENABLE ROW LEVEL SECURITY;

-- 3. FIX: Add SELECT Policy (This fixes the "empty list on refresh" bug)
-- Drops old policy to prevent conflicts
DROP POLICY IF EXISTS "Allow public read access" ON classroom_messages;
DROP POLICY IF EXISTS "Allow classroom members to read messages" ON classroom_messages;

-- Create the fix policy (Allows backend/frontend to read messages)
CREATE POLICY "Unrestricted read access for dev"
ON classroom_messages
FOR SELECT
USING (true);

-- 4. Ensure INSERT Policy Exists (since typing/sending works, we keep/ensure this)
DROP POLICY IF EXISTS "Allow public insert access" ON classroom_messages;
CREATE POLICY "Allow public insert access"
ON classroom_messages
FOR INSERT
WITH CHECK (true);

-- 5. Add/Fix Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_classroom_messages_classroom_id ON classroom_messages(classroom_id);
CREATE INDEX IF NOT EXISTS idx_classroom_messages_created_at ON classroom_messages(created_at);

-- ================================================================
-- ✅ READY TO RUN
-- Messages should now load correctly after refresh.
-- ================================================================


--- File: SUPABASE_FIX_ONBOARDING_RLS.sql ---
-- ==========================================
-- FIX SUPABASE RLS POLICIES FOR ONBOARDING
-- ==========================================
-- This script fixes the "new row violates row-level security policy" error
-- when creating divisions and faculty profiles. Because custom auth is used,
-- the backend and frontend execute these queries as the 'anon' role.
-- Previous policies only allowed SELECT (USING true) but blocked INSERTS.

-- Run this script in your Supabase SQL Editor.

DROP POLICY IF EXISTS "Allow public access to divisions" ON divisions;
CREATE POLICY "Allow public access to divisions" ON divisions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to faculty_profiles" ON faculty_profiles;
CREATE POLICY "Allow public access to faculty_profiles" ON faculty_profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to faculty_divisions" ON faculty_divisions;
CREATE POLICY "Allow public access to faculty_divisions" ON faculty_divisions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to timetable_periods" ON timetable_periods;
CREATE POLICY "Allow public access to timetable_periods" ON timetable_periods FOR ALL USING (true) WITH CHECK (true);

-- (Optional but recommended) Fix students as well in case they need to sign up later:
DROP POLICY IF EXISTS "Allow public access to students" ON students;
CREATE POLICY "Allow public access to students" ON students FOR ALL USING (true) WITH CHECK (true);


--- File: SUPABASE_HOLIDAYS_MIGRATION.sql ---
-- ═══════════════════════════════════════════════════════════
-- HOLIDAYS TABLE — Auto-fetched festivals + admin-managed holidays
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS holidays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id TEXT NOT NULL,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    year INTEGER,
    end_date DATE,  -- Nullable: for multi-day holidays (Diwali vacation, winter break)
    is_holiday BOOLEAN DEFAULT false,
    source TEXT DEFAULT 'google' CHECK (source IN ('google', 'manual')),
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Quick update for existing tables:
-- ALTER TABLE holidays ADD COLUMN IF NOT EXISTS year INTEGER;

-- Prevent duplicate festivals per org
CREATE UNIQUE INDEX IF NOT EXISTS idx_holidays_unique
    ON holidays (org_id, title, date);

-- Fast lookups for upcoming holidays
CREATE INDEX IF NOT EXISTS idx_holidays_org_date
    ON holidays (org_id, date);

-- Fast lookups for is_holiday checks
CREATE INDEX IF NOT EXISTS idx_holidays_org_active
    ON holidays (org_id, date, is_holiday) WHERE is_holiday = true;

-- ═══════════════════════════════════════════════════════════
-- RLS POLICIES (optional — currently using service key)
-- ═══════════════════════════════════════════════════════════
-- ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;


--- File: SUPABASE_INTERNAL_TESTS_MIGRATION.sql ---
-- ═══════════════════════════════════════════════════════════════════
-- CLASSGRID — INTERNAL TESTS MODULE MIGRATION
-- Run this ONCE in Supabase SQL Editor
-- Creates: internal_tests, internal_test_marks tables
-- ═══════════════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. INTERNAL TESTS TABLE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS internal_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL,
    classroom_id TEXT,                  -- MongoDB Classroom _id (optional — for classroom-level tests)
    division_id UUID,                   -- Supabase division reference
    teacher_id TEXT NOT NULL,           -- MongoDB user._id
    test_name TEXT NOT NULL,            -- e.g. "Weekly Test 1", "Internal Test 3"
    subject TEXT NOT NULL,              -- e.g. "mathematics", "physics"
    description TEXT,
    test_date DATE NOT NULL,
    total_marks INTEGER NOT NULL CHECK (total_marks > 0),
    question_file_url TEXT,             -- Optional PDF upload URL
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. INTERNAL TEST MARKS TABLE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS internal_test_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES internal_tests(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,           -- MongoDB user._id
    marks_obtained DECIMAL,            -- NULL = not yet graded
    remarks TEXT,
    graded_by TEXT,                     -- MongoDB teacher._id
    graded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- One entry per student per test
    UNIQUE(test_id, student_id)
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. INDEXES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE INDEX IF NOT EXISTS idx_internal_tests_org ON internal_tests(org_id);
CREATE INDEX IF NOT EXISTS idx_internal_tests_teacher ON internal_tests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_internal_tests_division ON internal_tests(division_id);
CREATE INDEX IF NOT EXISTS idx_internal_tests_date ON internal_tests(test_date);
CREATE INDEX IF NOT EXISTS idx_internal_tests_classroom ON internal_tests(classroom_id);

CREATE INDEX IF NOT EXISTS idx_internal_test_marks_test ON internal_test_marks(test_id);
CREATE INDEX IF NOT EXISTS idx_internal_test_marks_student ON internal_test_marks(student_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. ROW LEVEL SECURITY
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE internal_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_test_marks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_internal_tests" ON internal_tests;
CREATE POLICY "service_role_internal_tests" ON internal_tests
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_internal_test_marks" ON internal_test_marks;
CREATE POLICY "service_role_internal_test_marks" ON internal_test_marks
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5. AUTO-UPDATE TRIGGERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DROP TRIGGER IF EXISTS update_internal_tests_modtime ON internal_tests;
CREATE TRIGGER update_internal_tests_modtime
BEFORE UPDATE ON internal_tests
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_internal_test_marks_modtime ON internal_test_marks;
CREATE TRIGGER update_internal_test_marks_modtime
BEFORE UPDATE ON internal_test_marks
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- DONE! Internal Tests Module tables ready.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


--- File: SUPABASE_LEAVE_EXAM_MIGRATION.sql ---
-- LEAVE MANAGEMENT MODULE UPGRADE
-- Run this in Supabase SQL Editor

-- 1. Safely add new columns to leave_requests (without IF NOT EXISTS which can fail on serials)
DO $$ 
BEGIN 
  BEGIN
    ALTER TABLE leave_requests ADD COLUMN leave_type TEXT DEFAULT 'casual' CHECK (leave_type IN ('quick', 'casual', 'sick', 'long'));
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE leave_requests ADD COLUMN day_type TEXT DEFAULT 'full' CHECK (day_type IN ('full', 'first_half', 'second_half'));
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE leave_requests ADD COLUMN from_date DATE;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE leave_requests ADD COLUMN to_date DATE;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE leave_requests ADD COLUMN total_days DECIMAL(4,1) DEFAULT 1;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE leave_requests ADD COLUMN auto_message TEXT;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE leave_requests ADD COLUMN attachment_url TEXT;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE leave_requests ADD COLUMN doc_no BIGINT GENERATED BY DEFAULT AS IDENTITY;
  EXCEPTION WHEN duplicate_column THEN END;
END $$;

-- Migrate existing `date` → `from_date` and `to_date`
UPDATE leave_requests SET from_date = date::DATE, to_date = date::DATE WHERE from_date IS NULL;

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_leave_requests_student ON leave_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_teacher ON leave_requests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_type ON leave_requests(leave_type);

-- EXAMINATION MODULE TABLES
CREATE TABLE IF NOT EXISTS exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id TEXT NOT NULL,
  exam_name TEXT NOT NULL,
  type TEXT DEFAULT 'college' CHECK (type IN ('school', 'college')),
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'past', 'draft')),
  date_from DATE,
  date_to DATE,
  exam_fee DECIMAL(10,2) DEFAULT 0,
  fee_enabled BOOLEAN DEFAULT false,
  pdf_url TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_timetable_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  exam_date DATE NOT NULL,
  day_of_week TEXT,
  start_time TEXT,
  end_time TEXT,
  room TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid')),
  paid_at TIMESTAMPTZ,
  payment_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (exam_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_exams_org ON exams(org_id);
CREATE INDEX IF NOT EXISTS idx_exam_entries_exam ON exam_timetable_entries(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_entries_date ON exam_timetable_entries(exam_date);
CREATE INDEX IF NOT EXISTS idx_exam_fees_student ON exam_fees(student_id);

-- RLS Enable
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_timetable_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_fees ENABLE ROW LEVEL SECURITY;

-- Safely drop old policies if they exist so we don't get 'policy already exists' errors
DO $$ 
BEGIN
  -- Exams
  DROP POLICY IF EXISTS "exams_read_all" ON exams;
  DROP POLICY IF EXISTS "exams_insert_service" ON exams;
  DROP POLICY IF EXISTS "exams_update_service" ON exams;
  DROP POLICY IF EXISTS "exams_delete_service" ON exams;
  
  -- Entries
  DROP POLICY IF EXISTS "exam_entries_read_all" ON exam_timetable_entries;
  DROP POLICY IF EXISTS "exam_entries_insert_service" ON exam_timetable_entries;
  DROP POLICY IF EXISTS "exam_entries_update_service" ON exam_timetable_entries;
  DROP POLICY IF EXISTS "exam_entries_delete_service" ON exam_timetable_entries;

  -- Fees
  DROP POLICY IF EXISTS "exam_fees_read_all" ON exam_fees;
  DROP POLICY IF EXISTS "exam_fees_insert_service" ON exam_fees;
  DROP POLICY IF EXISTS "exam_fees_update_service" ON exam_fees;
END $$;

-- Create Policies (Using 'true' for MVP so your backend can insert without failing due to RLS)
CREATE POLICY "exams_read_all" ON exams FOR SELECT USING (true);
CREATE POLICY "exams_insert_service" ON exams FOR INSERT WITH CHECK (true);
CREATE POLICY "exams_update_service" ON exams FOR UPDATE USING (true);
CREATE POLICY "exams_delete_service" ON exams FOR DELETE USING (true);

CREATE POLICY "exam_entries_read_all" ON exam_timetable_entries FOR SELECT USING (true);
CREATE POLICY "exam_entries_insert_service" ON exam_timetable_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "exam_entries_update_service" ON exam_timetable_entries FOR UPDATE USING (true);
CREATE POLICY "exam_entries_delete_service" ON exam_timetable_entries FOR DELETE USING (true);

CREATE POLICY "exam_fees_read_all" ON exam_fees FOR SELECT USING (true);
CREATE POLICY "exam_fees_insert_service" ON exam_fees FOR INSERT WITH CHECK (true);
CREATE POLICY "exam_fees_update_service" ON exam_fees FOR UPDATE USING (true);


--- File: SUPABASE_LIBRARY_MIGRATION.sql ---
-- =====================================================================
-- CLASSGRID — LIBRARY MANAGEMENT MODULE MIGRATION (v2 + Reservations)
-- Run this ONCE in Supabase SQL Editor
-- =====================================================================

-- PART 1: LIBRARY BOOKS (Catalog)
CREATE TABLE IF NOT EXISTS library_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id TEXT NOT NULL,
    book_id TEXT NOT NULL,
    book_name TEXT NOT NULL,
    subject TEXT,
    total_copies INTEGER DEFAULT 1,
    available_copies INTEGER DEFAULT 1,
    is_auto_categorized BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(org_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_library_books_search ON library_books(org_id, book_name);
CREATE INDEX IF NOT EXISTS idx_library_books_subject ON library_books(org_id, subject);

ALTER TABLE library_books ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Anyone in org can view books" ON library_books;
    DROP POLICY IF EXISTS "Admins and Managers can manage books" ON library_books;
    DROP POLICY IF EXISTS "Service role full access books" ON library_books;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Anyone in org can view books"
    ON library_books FOR SELECT USING (true);
CREATE POLICY "Admins and Managers can manage books"
    ON library_books FOR ALL USING (true);
CREATE POLICY "Service role full access books"
    ON library_books FOR ALL USING (true);


-- PART 2: LIBRARY COPIES (Physical Barcodes - Optional)
CREATE TABLE IF NOT EXISTS library_copies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id TEXT NOT NULL,
    book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
    copy_id TEXT NOT NULL,
    status TEXT DEFAULT 'Available',
    condition_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(org_id, copy_id)
);

CREATE INDEX IF NOT EXISTS idx_library_copies_book ON library_copies(book_id);

ALTER TABLE library_copies ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Anyone in org can view copies" ON library_copies;
    DROP POLICY IF EXISTS "Admins and Managers can manage copies" ON library_copies;
    DROP POLICY IF EXISTS "Service role full access copies" ON library_copies;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Anyone in org can view copies"
    ON library_copies FOR SELECT USING (true);
CREATE POLICY "Admins and Managers can manage copies"
    ON library_copies FOR ALL USING (true);
CREATE POLICY "Service role full access copies"
    ON library_copies FOR ALL USING (true);


-- PART 3: LIBRARY TRANSACTIONS (Issues & Returns)
CREATE TABLE IF NOT EXISTS library_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id TEXT NOT NULL,
    book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
    copy_id UUID REFERENCES library_copies(id) ON DELETE SET NULL,
    student_id TEXT NOT NULL,
    issued_by TEXT NOT NULL,
    issue_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    return_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'Issued',
    fine_amount DECIMAL(10,2) DEFAULT 0.00,
    fine_status TEXT DEFAULT 'Unpaid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_library_trans_student ON library_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_library_trans_status ON library_transactions(org_id, status);

ALTER TABLE library_transactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Students can view own transactions" ON library_transactions;
    DROP POLICY IF EXISTS "Admins and Managers can manage transactions" ON library_transactions;
    DROP POLICY IF EXISTS "Service role full access transactions" ON library_transactions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Students can view own transactions"
    ON library_transactions FOR SELECT USING (true);
CREATE POLICY "Admins and Managers can manage transactions"
    ON library_transactions FOR ALL USING (true);
CREATE POLICY "Service role full access transactions"
    ON library_transactions FOR ALL USING (true);


-- PART 4: LIBRARY RESERVATIONS (Book Hold Queue) — NEW
CREATE TABLE IF NOT EXISTS library_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id TEXT NOT NULL,
    book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    queue_position INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT reservation_status_check CHECK (status IN ('pending', 'fulfilled', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_reservations_book ON library_reservations(book_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_student ON library_reservations(student_id);

ALTER TABLE library_reservations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Anyone can view reservations" ON library_reservations;
    DROP POLICY IF EXISTS "Full access reservations" ON library_reservations;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Anyone can view reservations"
    ON library_reservations FOR SELECT USING (true);
CREATE POLICY "Full access reservations"
    ON library_reservations FOR ALL USING (true);


-- PART 5: AUTO-UPDATE TRIGGERS
DROP TRIGGER IF EXISTS update_library_books_modtime ON library_books;
CREATE TRIGGER update_library_books_modtime
BEFORE UPDATE ON library_books
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_library_copies_modtime ON library_copies;
CREATE TRIGGER update_library_copies_modtime
BEFORE UPDATE ON library_copies
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_library_transactions_modtime ON library_transactions;
CREATE TRIGGER update_library_transactions_modtime
BEFORE UPDATE ON library_transactions
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_library_reservations_modtime ON library_reservations;
CREATE TRIGGER update_library_reservations_modtime
BEFORE UPDATE ON library_reservations
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();


--- File: SUPABASE_MATERIAL_SUMMARIES.sql ---
-- Create the material_summaries table for caching AI summaries
-- Run this on the CLASSROOM Supabase project

CREATE TABLE IF NOT EXISTS material_summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    material_id UUID NOT NULL UNIQUE,
    classroom_id TEXT NOT NULL,
    summary TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by material_id
CREATE INDEX IF NOT EXISTS idx_material_summaries_material_id ON material_summaries (material_id);

-- Allow the service_role to manage this table (RLS disabled for server-side only access)
ALTER TABLE material_summaries ENABLE ROW LEVEL SECURITY;

-- Service role bypass policy (since we use service_role key from backend)
CREATE POLICY "Service role full access" ON material_summaries
    FOR ALL
    USING (true)
    WITH CHECK (true);


--- File: SUPABASE_ORG_CENTRIC_MIGRATION.sql ---
-- =========================================================================
-- CLASSGRID ORG-CENTRIC ACADEMIC SYSTEM MIGRATION
-- Copy and paste everything below into your Supabase SQL Editor and hit RUN
-- =========================================================================

-- 1. Faculty Profiles
CREATE TABLE IF NOT EXISTS faculty_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL, -- Maps to MongoDB User._id
  org_id TEXT,                  -- Maps to MongoDB Organization._id
  full_name TEXT NOT NULL,
  title TEXT NOT NULL,          -- Prof, Dr, Mr, Mrs, Other
  qualification TEXT,
  experience TEXT,
  specialization TEXT,
  subjects TEXT[] DEFAULT '{}',
  roles TEXT[] DEFAULT '{}',    -- (Legacy)
  divisions TEXT[] DEFAULT '{}',-- (Legacy)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Students
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL, -- Maps to MongoDB User._id
  org_id TEXT,                  -- Maps to MongoDB Organization._id
  name TEXT NOT NULL,
  prn TEXT,
  roll_no TEXT,
  division TEXT NOT NULL,       -- (Legacy)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Central Divisions Table
CREATE TABLE IF NOT EXISTS divisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id TEXT NOT NULL,      -- Maps to MongoDB Organization._id
  name TEXT NOT NULL,        -- e.g., 'FY-A', 'SY-B'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, name)
);

-- 4. Faculty Divisions (Mapping Table for Multiple Roles)
CREATE TABLE IF NOT EXISTS faculty_divisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id UUID REFERENCES faculty_profiles(id) ON DELETE CASCADE,
  division_id UUID REFERENCES divisions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,        -- 'class_teacher', 'assistant_teacher', 'subject_teacher'
  start_date DATE NOT NULL,  -- For academic year tracking
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(faculty_id, division_id, role)
);

-- Enforce maximum 1 Class Teacher per division
CREATE UNIQUE INDEX IF NOT EXISTS one_class_teacher_per_division 
ON faculty_divisions (division_id) 
WHERE role = 'class_teacher';

-- 5. Class Roles (CR / Monitor)
-- Enforces only 1 CR and 1 Monitor per division (using division_id)
CREATE TABLE IF NOT EXISTS class_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  division TEXT,                -- (Legacy)
  division_id UUID REFERENCES divisions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  role TEXT NOT NULL,           -- 'CR', 'Monitor'
  assigned_by UUID REFERENCES faculty_profiles(id) DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(division_id, role)        -- Only 1 specific role per division!
);

-- 6. Analytics: Attendance Tracking
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  division TEXT,                -- (Legacy)
  division_id UUID REFERENCES divisions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL, -- 'present', 'absent'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Analytics: Assignment Submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  assignment_id TEXT NOT NULL,
  status TEXT NOT NULL, -- 'submitted', 'pending'
  submitted_at TIMESTAMPTZ
);

-- 8. Analytics: Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL, -- Matches MongoDB user._id
  action TEXT NOT NULL, -- 'login', 'view_classroom', 'submit_assignment'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Alter Existing Tables to Use new division_id references
ALTER TABLE students ADD COLUMN IF NOT EXISTS division_id UUID REFERENCES divisions(id);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS natively for all tables
ALTER TABLE faculty_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create Policies (Allows any logged in user strictly through the React UI)
CREATE POLICY "Allow public access to faculty_profiles" ON faculty_profiles FOR ALL USING (true);
CREATE POLICY "Allow public access to students" ON students FOR ALL USING (true);
CREATE POLICY "Allow public access to class_roles" ON class_roles FOR ALL USING (true);
CREATE POLICY "Allow public access to divisions" ON divisions FOR ALL USING (true);
CREATE POLICY "Allow public access to faculty_divisions" ON faculty_divisions FOR ALL USING (true);
CREATE POLICY "Allow public access to attendance" ON attendance FOR ALL USING (true);
CREATE POLICY "Allow public access to assignment_submissions" ON assignment_submissions FOR ALL USING (true);
CREATE POLICY "Allow public access to activity_logs" ON activity_logs FOR ALL USING (true);

-- BOOM. ALL DONE!


--- File: SUPABASE_PROMOTION_SYSTEM.sql ---
-- =========================================================================
-- CLASSGRID ACADEMIC PROMOTION SYSTEM
-- Production-grade lifecycle engine for student academic progression
-- Run in Supabase SQL Editor
-- =========================================================================

-- ─── 1. ACADEMIC YEARS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  name TEXT NOT NULL,                          -- "2025-2026"
  is_active BOOLEAN DEFAULT false,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, name)
);

-- Only ONE active year per org (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS one_active_year_per_org
ON academic_years (org_id) WHERE is_active = true;

ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to academic_years" ON academic_years
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');


-- ─── 2. DIVISION PROMOTIONS (MAPPING) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS division_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  from_division_id UUID NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  to_division_id UUID NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, from_division_id)
);

ALTER TABLE division_promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to division_promotions" ON division_promotions
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');


-- ─── 3. PROMOTION BATCHES (STATE MACHINE + METADATA) ──────────────────
CREATE TABLE IF NOT EXISTS promotion_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  from_academic_year_id UUID REFERENCES academic_years(id),
  to_academic_year_id UUID REFERENCES academic_years(id),
  status TEXT NOT NULL DEFAULT 'idle'
    CHECK (status IN ('idle', 'running', 'completed', 'failed')),
  total_students INT DEFAULT 0,
  promoted_count INT DEFAULT 0,
  graduated_count INT DEFAULT 0,
  excluded_count INT DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by TEXT,                              -- admin user_id
  batch_created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE promotion_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to promotion_batches" ON promotion_batches
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');


-- ─── 4. PROMOTION LOGS (AUDIT TRAIL) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS promotion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_batch_id UUID NOT NULL REFERENCES promotion_batches(id),
  student_id UUID NOT NULL,
  org_id TEXT NOT NULL,
  from_division_id UUID,
  to_division_id UUID,
  from_standard INT,
  to_standard INT,
  from_year TEXT,
  to_year TEXT,
  from_semester INT,
  to_semester INT,
  from_academic_year_id UUID,
  to_academic_year_id UUID,
  new_status TEXT,                              -- 'active' or 'graduated'
  promoted_by TEXT,
  promoted_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE promotion_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to promotion_logs" ON promotion_logs
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_promotion_logs_batch
ON promotion_logs (promotion_batch_id);


-- ─── 5. STUDENT ACADEMIC HISTORY (PRE-PROMOTION SNAPSHOT) ─────────────
CREATE TABLE IF NOT EXISTS student_academic_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_batch_id UUID NOT NULL REFERENCES promotion_batches(id),
  student_id UUID NOT NULL,
  org_id TEXT,
  division_id UUID,
  standard INT,
  year TEXT,
  semester INT,
  academic_year_id UUID,
  status TEXT,
  snapshot_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE student_academic_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to student_academic_history" ON student_academic_history
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');


-- ─── 6. ALTER STUDENTS TABLE ──────────────────────────────────────────
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES academic_years(id),
  ADD COLUMN IF NOT EXISTS standard INT,
  ADD COLUMN IF NOT EXISTS year TEXT,
  ADD COLUMN IF NOT EXISTS semester INT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'graduated', 'failed', 'transferred')),
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Hard constraint: student cannot exist twice in the same academic year
-- Using a unique index with coalesce to handle NULLs safely
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_year_unique
ON students (user_id, coalesce(academic_year_id, '00000000-0000-0000-0000-000000000000'));

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_students_org_year
ON students (org_id, academic_year_id);

CREATE INDEX IF NOT EXISTS idx_students_division
ON students (division_id);


-- ─── 7. SUPABASE RPC: BATCH PROMOTE ──────────────────────────────────
-- This function does the entire promotion in one DB transaction.
-- Called from the backend with: supabase.rpc('execute_promotion', { ... })

CREATE OR REPLACE FUNCTION execute_promotion(
  p_batch_id UUID,
  p_org_id TEXT,
  p_to_academic_year_id UUID,
  p_excluded_ids UUID[],
  p_admin_id TEXT,
  p_org_type TEXT                               -- 'SCHOOL' or 'COLLEGE'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_student RECORD;
  v_next_standard INT;
  v_next_semester INT;
  v_next_year TEXT;
  v_next_division_id UUID;
  v_next_status TEXT;
  v_promoted INT := 0;
  v_graduated INT := 0;
  v_total INT := 0;
  v_mapping UUID;
  v_section TEXT;
  v_target_div_name TEXT;
BEGIN
  -- Mark batch as running
  UPDATE promotion_batches
  SET status = 'running', started_at = now()
  WHERE id = p_batch_id;

  -- Loop through eligible students
  FOR v_student IN
    SELECT s.*, d.name AS division_name
    FROM students s
    LEFT JOIN divisions d ON d.id = s.division_id
    WHERE s.org_id = p_org_id
      AND s.status = 'active'
      AND (s.academic_year_id IS NULL OR s.academic_year_id != p_to_academic_year_id)
      AND s.id != ALL(p_excluded_ids)
    ORDER BY s.name
  LOOP
    v_total := v_total + 1;

    -- 1. Snapshot current state
    INSERT INTO student_academic_history
      (promotion_batch_id, student_id, org_id, division_id, standard, year, semester, academic_year_id, status)
    VALUES
      (p_batch_id, v_student.id, v_student.org_id, v_student.division_id,
       v_student.standard, v_student.year, v_student.semester,
       v_student.academic_year_id, v_student.status);

    -- 2. Calculate next state
    v_next_status := 'active';

    IF p_org_type = 'SCHOOL' THEN
      v_next_standard := COALESCE(v_student.standard, 0) + 1;
      v_next_semester := v_student.semester;
      v_next_year := v_student.year;

      IF v_next_standard > 12 THEN
        v_next_status := 'graduated';
      END IF;

    ELSE
      -- COLLEGE
      v_next_semester := COALESCE(v_student.semester, 0) + 1;
      v_next_standard := v_student.standard;

      IF v_next_semester > 8 THEN
        v_next_status := 'graduated';
      ELSE
        v_next_year := CASE
          WHEN v_next_semester <= 2 THEN 'FY'
          WHEN v_next_semester <= 4 THEN 'SY'
          WHEN v_next_semester <= 6 THEN 'TY'
          ELSE 'BE'
        END;
      END IF;
    END IF;

    -- 3. Division mapping (check custom, fallback to same letter)
    IF v_next_status = 'graduated' THEN
      v_next_division_id := v_student.division_id;  -- keep as-is
    ELSE
      SELECT to_division_id INTO v_mapping
      FROM division_promotions
      WHERE org_id = p_org_id AND from_division_id = v_student.division_id
      LIMIT 1;

      IF v_mapping IS NOT NULL THEN
        v_next_division_id := v_mapping;
      ELSE
        -- Fallback: find division with same section letter in next Academic structure
        v_section := regexp_replace(v_student.division_name, '.*\s', '');

        IF p_org_type = 'SCHOOL' THEN
          v_target_div_name := v_next_standard::TEXT || 'th ' || v_section;
          -- Handle special ordinals
          IF v_next_standard = 1 THEN v_target_div_name := '1st ' || v_section;
          ELSIF v_next_standard = 2 THEN v_target_div_name := '2nd ' || v_section;
          ELSIF v_next_standard = 3 THEN v_target_div_name := '3rd ' || v_section;
          END IF;
        ELSE
          v_target_div_name := v_next_year || ' Sem ' || v_next_semester || ' ' || v_section;
        END IF;

        SELECT id INTO v_next_division_id
        FROM divisions
        WHERE org_id = p_org_id AND UPPER(name) = UPPER(v_target_div_name)
        LIMIT 1;

        -- Auto-create if missing (same naming pattern)
        IF v_next_division_id IS NULL AND v_target_div_name IS NOT NULL THEN
          INSERT INTO divisions (org_id, name)
          VALUES (p_org_id, v_target_div_name)
          RETURNING id INTO v_next_division_id;
        END IF;

        -- Final fallback: keep same division
        IF v_next_division_id IS NULL THEN
          v_next_division_id := v_student.division_id;
        END IF;
      END IF;
    END IF;

    -- 4. Update student
    UPDATE students SET
      standard = v_next_standard,
      semester = v_next_semester,
      year = v_next_year,
      division_id = v_next_division_id,
      academic_year_id = p_to_academic_year_id,
      status = v_next_status
    WHERE id = v_student.id;

    -- 5. Log
    INSERT INTO promotion_logs
      (promotion_batch_id, student_id, org_id,
       from_division_id, to_division_id,
       from_standard, to_standard,
       from_year, to_year,
       from_semester, to_semester,
       from_academic_year_id, to_academic_year_id,
       new_status, promoted_by)
    VALUES
      (p_batch_id, v_student.id, p_org_id,
       v_student.division_id, v_next_division_id,
       v_student.standard, v_next_standard,
       v_student.year, v_next_year,
       v_student.semester, v_next_semester,
       v_student.academic_year_id, p_to_academic_year_id,
       v_next_status, p_admin_id);

    IF v_next_status = 'graduated' THEN
      v_graduated := v_graduated + 1;
    ELSE
      v_promoted := v_promoted + 1;
    END IF;

  END LOOP;

  -- 6. Finalize batch
  UPDATE promotion_batches SET
    status = 'completed',
    total_students = v_total,
    promoted_count = v_promoted,
    graduated_count = v_graduated,
    excluded_count = array_length(p_excluded_ids, 1),
    completed_at = now()
  WHERE id = p_batch_id;

  RETURN jsonb_build_object(
    'success', true,
    'total', v_total,
    'promoted', v_promoted,
    'graduated', v_graduated,
    'excluded', COALESCE(array_length(p_excluded_ids, 1), 0)
  );

EXCEPTION WHEN OTHERS THEN
  -- NOTE: Since the function runs in a single transaction, this UPDATE
  -- will also be rolled back. The caller (Node.js backend) is responsible
  -- for marking the batch as 'failed' if the RPC call returns an error.
  -- We still return the error details for the caller to handle.

  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- DONE. Academic Promotion System ready.


--- File: SUPABASE_QUALIFICATIONS_UPGRADE_MIGRATION.sql ---
-- ═══════════════════════════════════════════════════════════════════
-- CLASSGRID — QUALIFICATIONS SCHEMA UPGRADE
-- Run this ONCE in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE student_past_qualifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- DONE


--- File: SUPABASE_REACTIONS_MIGRATION.sql ---
-- ═══════════════════════════════════════════════════════════
-- CHAT REACTIONS TABLE — SUPABASE MIGRATION
-- Run this in your Chat Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ═══ REACTIONS TABLE ═══
-- Stores emoji reactions on chat messages (one row per user+message+emoji)
CREATE TABLE IF NOT EXISTS chat_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- ═══ INDEXES ═══
CREATE INDEX IF NOT EXISTS idx_reactions_message ON chat_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON chat_reactions(user_id);

-- ═══ RLS ═══
ALTER TABLE chat_reactions ENABLE ROW LEVEL SECURITY;

-- Allow read for all (needed for loading reactions with messages)
CREATE POLICY "Allow read reactions"
ON chat_reactions FOR SELECT USING (true);

-- Allow insert/delete via service role (backend)
CREATE POLICY "Allow insert reactions"
ON chat_reactions FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow delete reactions"
ON chat_reactions FOR DELETE USING (true);


--- File: SUPABASE_REALTIME_FIX.sql ---
-- ================================================================
-- 🚀 FORCE REALTIME FIX (Run in Supabase "SQL Editor")
-- ================================================================

-- 1. Enable REPLICA IDENTITY FULL
-- Expected to fix "no broadcast" issue on INSERT
ALTER TABLE classroom_messages REPLICA IDENTITY FULL;

-- 2. Ensure RLS Allows SELECT (Critical for Realtime)
-- Realtime respects RLS. If checking/selecting is blocked, the row is hidden.
DROP POLICY IF EXISTS "Allow read access for realtime" ON classroom_messages;

CREATE POLICY "Allow read access for realtime"
ON classroom_messages
FOR SELECT
USING (true); -- Allows everyone to read (needed for Realtime + Anon key)

-- 3. Verify Table & Columns
-- Run this to double-check your schema matches the code
SELECT
    column_name,
    data_type
FROM
    information_schema.columns
WHERE
    table_name = 'classroom_messages';

-- ================================================================
-- ✅ AFTER RUNNING THIS:
-- 1. Restart your local server / refresh the page.
-- 2. If valid, new messages should appear instantly.
-- ================================================================


--- File: SUPABASE_RESULT_ENGINE_MIGRATION.sql ---
-- ============================================================
-- CLASSGRID - RESULT ENGINE MIGRATION v3 (Phase 2)
-- Supports: School + College mode, Ranking, Extended Status,
-- SGPA/CGPA, Normalization, Grace, Best-of-N, DB Lock
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. RESULT SCHEMES
CREATE TABLE IF NOT EXISTS result_schemes (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                   TEXT NOT NULL,
    division_id              UUID,
    name                     TEXT NOT NULL,
    academic_year            TEXT,
    semester                 TEXT,
    rules_json               JSONB NOT NULL DEFAULT '{}',
    status                   TEXT NOT NULL DEFAULT 'draft',
    is_generating            BOOLEAN DEFAULT false,
    generation_time_seconds  FLOAT,
    last_student_count       INTEGER,
    created_by               TEXT,
    created_at               TIMESTAMPTZ DEFAULT now(),
    updated_at               TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT result_schemes_status_check
        CHECK (status IN ('draft', 'generated', 'published', 'locked'))
);

-- 2. RESULT SUBJECTS
CREATE TABLE IF NOT EXISTS result_subjects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_id       UUID NOT NULL REFERENCES result_schemes(id) ON DELETE CASCADE,
    org_id          TEXT NOT NULL,
    subject_code    TEXT,
    subject_name    TEXT NOT NULL,
    course_type     TEXT DEFAULT 'THEORY',
    max_marks       INTEGER NOT NULL DEFAULT 100,
    pass_marks      INTEGER,
    credits         INTEGER DEFAULT 2,
    created_at      TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT course_type_check
        CHECK (course_type IN ('THEORY', 'LAB', 'ELECTIVE'))
);

-- 3. RESULT MARKS (raw per-student, per-subject)
CREATE TABLE IF NOT EXISTS result_marks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_id       UUID NOT NULL REFERENCES result_schemes(id) ON DELETE CASCADE,
    subject_id      UUID NOT NULL REFERENCES result_subjects(id) ON DELETE CASCADE,
    org_id          TEXT NOT NULL,
    student_id      TEXT NOT NULL,
    marks_obtained  FLOAT,
    is_absent       BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(scheme_id, subject_id, student_id),
    CONSTRAINT absent_null_check
        CHECK (
            (is_absent = false AND marks_obtained IS NOT NULL)
            OR (is_absent = true AND marks_obtained IS NULL)
        )
);

-- 4. RESULTS (final computed output)
-- Phase 2: sgpa, scheme_rank, percentage_equivalent, extended statuses
CREATE TABLE IF NOT EXISTS results (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_id              UUID NOT NULL REFERENCES result_schemes(id) ON DELETE CASCADE,
    org_id                 TEXT NOT NULL,
    student_id             TEXT NOT NULL,
    total_marks            FLOAT,
    max_total_marks        FLOAT,
    percentage             FLOAT,
    grade                  TEXT,
    grade_points           FLOAT,
    sgpa                   FLOAT,
    cgpa                   FLOAT,
    percentage_equivalent  FLOAT,
    earn_credits           INTEGER DEFAULT 0,
    total_credits          INTEGER DEFAULT 0,
    scheme_rank            INTEGER,
    status                 TEXT,
    result_detail          JSONB,
    version                INTEGER DEFAULT 1,
    generated_at           TIMESTAMPTZ DEFAULT now(),
    UNIQUE(scheme_id, student_id),
    CONSTRAINT results_status_check
        CHECK (status IN (
            'pass', 'fail', 'compartment',
            'distinction', 'first_class', 'higher_second_class', 'second_class'
        ))
);

-- ========================
-- ROW LEVEL SECURITY
-- ========================

ALTER TABLE result_schemes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE result_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE result_marks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE results         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_admin_result_schemes" ON result_schemes
    USING ((auth.jwt() ->> 'org_id') = org_id OR (auth.jwt() ->> 'role') = 'super_admin')
    WITH CHECK ((auth.jwt() ->> 'org_id') = org_id);

CREATE POLICY "org_admin_result_subjects" ON result_subjects
    USING ((auth.jwt() ->> 'org_id') = org_id)
    WITH CHECK ((auth.jwt() ->> 'org_id') = org_id);

CREATE POLICY "org_admin_result_marks" ON result_marks
    USING ((auth.jwt() ->> 'org_id') = org_id)
    WITH CHECK ((auth.jwt() ->> 'org_id') = org_id);

-- Students only see published results
CREATE POLICY "student_read_own_published_results" ON results
    FOR SELECT USING (
        (auth.jwt() ->> 'org_id') = org_id
        AND (auth.jwt() ->> 'sub') = student_id
        AND EXISTS (
            SELECT 1 FROM result_schemes rs
            WHERE rs.id = results.scheme_id
            AND rs.status = 'published'
        )
    );

CREATE POLICY "admin_full_results" ON results
    USING ((auth.jwt() ->> 'org_id') = org_id)
    WITH CHECK ((auth.jwt() ->> 'org_id') = org_id);

-- ========================
-- INDEXES
-- ========================

CREATE INDEX IF NOT EXISTS idx_result_schemes_org    ON result_schemes(org_id);
CREATE INDEX IF NOT EXISTS idx_result_subjects_scheme ON result_subjects(scheme_id);
CREATE INDEX IF NOT EXISTS idx_result_marks_scheme   ON result_marks(scheme_id);
CREATE INDEX IF NOT EXISTS idx_result_marks_student  ON result_marks(student_id);
CREATE INDEX IF NOT EXISTS idx_marks_validation      ON result_marks(scheme_id, subject_id, student_id);
CREATE INDEX IF NOT EXISTS idx_results_scheme        ON results(scheme_id);
CREATE INDEX IF NOT EXISTS idx_results_student       ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_rank          ON results(scheme_id, percentage DESC);

-- ========================
-- IF TABLES ALREADY EXIST - Run these ALTERs separately
-- ========================
-- ALTER TABLE result_schemes ADD COLUMN IF NOT EXISTS is_generating BOOLEAN DEFAULT false;
-- ALTER TABLE result_schemes ADD COLUMN IF NOT EXISTS generation_time_seconds FLOAT;
-- ALTER TABLE result_schemes ADD COLUMN IF NOT EXISTS last_student_count INTEGER;
-- ALTER TABLE results ADD COLUMN IF NOT EXISTS sgpa FLOAT;
-- ALTER TABLE results ADD COLUMN IF NOT EXISTS scheme_rank INTEGER;
-- ALTER TABLE results ADD COLUMN IF NOT EXISTS percentage_equivalent FLOAT;
-- ALTER TABLE results DROP CONSTRAINT IF EXISTS results_status_check;
-- ALTER TABLE results ADD CONSTRAINT results_status_check CHECK (status IN ('pass','fail','compartment','distinction','first_class','higher_second_class','second_class'));

-- DONE


--- File: SUPABASE_RESULT_ENGINE_UPGRADES.sql ---
-- ============================================================
-- CLASSGRID - RESULT ENGINE UNIVERSITY UPGRADES
-- Adds EduPlus-style metadata without replacing existing tables.
-- ============================================================

ALTER TABLE result_subjects
    ADD COLUMN IF NOT EXISTS course_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS teacher_id TEXT;

ALTER TABLE result_marks
    ADD COLUMN IF NOT EXISTS internal_marks DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS external_marks DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS seat_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS is_backlog BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS passed_in_reexam BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS ordinance_applied VARCHAR(100);

ALTER TABLE results
    ADD COLUMN IF NOT EXISTS seat_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS snapshot_student_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS snapshot_prn VARCHAR(100),
    ADD COLUMN IF NOT EXISTS snapshot_abc_id VARCHAR(50),
    ADD COLUMN IF NOT EXISTS snapshot_father_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS snapshot_mother_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS snapshot_dob DATE,
    ADD COLUMN IF NOT EXISTS snapshot_eligibility_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS snapshot_pattern VARCHAR(50),
    ADD COLUMN IF NOT EXISTS snapshot_program VARCHAR(150),
    ADD COLUMN IF NOT EXISTS snapshot_college VARCHAR(255);

CREATE TABLE IF NOT EXISTS result_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_id UUID REFERENCES result_schemes(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    changed_by TEXT,
    reason TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_result_subjects_teacher ON result_subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_result_audit_logs_scheme ON result_audit_logs(scheme_id);
CREATE INDEX IF NOT EXISTS idx_result_audit_logs_student ON result_audit_logs(student_id);


--- File: SUPABASE_RLS_FIX.sql ---
-- ==========================================
-- FIX SUPABASE RLS POLICIES FOR CUSTOM AUTH
-- ==========================================
-- Since you are using a custom login system (not Supabase Auth), 
-- Supabase sees your users as "anon" (anonymous).
-- By default, RLS blocks inserts from "anon".

-- Run this script in the Supabase SQL Editor to fix the "new row violates row-level security policy" error.

-- 1. Drop existing strict policies (if any)
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON materials;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON quizzes;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON announcements;
DROP POLICY IF EXISTS "Allow Frontend Insert Materials" ON materials;
DROP POLICY IF EXISTS "Allow Frontend Insert Quizzes" ON quizzes;
DROP POLICY IF EXISTS "Allow Frontend Insert Announcements" ON announcements;

-- 2. Create Permissive Policies for Materials
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow Frontend Insert Materials" ON materials FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Public Read Materials" ON materials FOR SELECT USING (true);

-- 3. Create Permissive Policies for Quizzes
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow Frontend Insert Quizzes" ON quizzes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Public Read Quizzes" ON quizzes FOR SELECT USING (true);

-- 4. Create Permissive Policies for Announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow Frontend Insert Announcements" ON announcements FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Public Read Announcements" ON announcements FOR SELECT USING (true);

-- 5. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE materials, quizzes, announcements;

-- ==========================================
-- STORAGE POLICIES (Bucket: notes-files)
-- ==========================================
-- Ensure you have a bucket named 'notes-files' created and publicly accessible.
-- You might need to add policies via the Storage UI, but here is the SQL equivalent if supported:

-- Allow public read of files
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'notes-files' );

-- Allow uploads (Insert) for everyone (since your auth is custom)
-- CREATE POLICY "Allow Uploads" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'notes-files' );


--- File: supabase_schema.sql ---
-- Run this in your Supabase SQL Editor

-- 1. Table for Comments on Announcements and Notes
CREATE TABLE IF NOT EXISTS content_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL,
    classroom_id TEXT,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_role TEXT,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster querying by content_id
CREATE INDEX IF NOT EXISTS idx_content_comments_content_id ON content_comments(content_id);

-- 2. Table for Organization-wide Direct Messages
CREATE TABLE IF NOT EXISTS org_direct_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    sender_name TEXT,
    receiver_id TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for querying direct messages quickly
CREATE INDEX IF NOT EXISTS idx_org_direct_messages_org_id ON org_direct_messages(org_id);
CREATE INDEX IF NOT EXISTS idx_org_direct_messages_participants 
ON org_direct_messages(sender_id, receiver_id);


--- File: SUPABASE_STUDENT_PROFILE_MIGRATION.sql ---
--- Migration script for Student Profile Sub-modules

-- 1. Family Info Table
CREATE TABLE IF NOT EXISTS student_family_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL UNIQUE,
    father_name TEXT,
    mother_name TEXT,
    parent_contact TEXT,
    emergency_contact TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS for Family Info
ALTER TABLE student_family_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own family info" ON student_family_info;
CREATE POLICY "Users can view their own family info" 
    ON student_family_info FOR SELECT 
    USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert their own family info" ON student_family_info;
CREATE POLICY "Users can insert their own family info" 
    ON student_family_info FOR INSERT 
    WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update their own family info" ON student_family_info;
CREATE POLICY "Users can update their own family info" 
    ON student_family_info FOR UPDATE 
    USING (auth.uid()::text = user_id);

-- 2. Past Qualifications Table
CREATE TABLE IF NOT EXISTS student_past_qualifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    qual_type TEXT NOT NULL, -- 'ssc', 'hsc', 'diploma'
    board TEXT,
    passing_year TEXT,
    marks TEXT,
    stream TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, qual_type)
);

-- RLS for Past Qualifications
ALTER TABLE student_past_qualifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own past qualifications" ON student_past_qualifications;
CREATE POLICY "Users can view their own past qualifications" 
    ON student_past_qualifications FOR SELECT 
    USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert their own past qualifications" ON student_past_qualifications;
CREATE POLICY "Users can insert their own past qualifications" 
    ON student_past_qualifications FOR INSERT 
    WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update their own past qualifications" ON student_past_qualifications;
CREATE POLICY "Users can update their own past qualifications" 
    ON student_past_qualifications FOR UPDATE 
    USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete their own past qualifications" ON student_past_qualifications;
CREATE POLICY "Users can delete their own past qualifications" 
    ON student_past_qualifications FOR DELETE 
    USING (auth.uid()::text = user_id);

-- 3. Documents Table
CREATE TABLE IF NOT EXISTS student_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    doc_type TEXT NOT NULL, -- 'ssc_cert', 'hsc_cert', 'leaving_cert', 'category_cert', 'other'
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, doc_type)
);

-- RLS for Documents
ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own documents" ON student_documents;
CREATE POLICY "Users can view their own documents" 
    ON student_documents FOR SELECT 
    USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert their own documents" ON student_documents;
CREATE POLICY "Users can insert their own documents" 
    ON student_documents FOR INSERT 
    WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update their own documents" ON student_documents;
CREATE POLICY "Users can update their own documents" 
    ON student_documents FOR UPDATE 
    USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete their own documents" ON student_documents;
CREATE POLICY "Users can delete their own documents" 
    ON student_documents FOR DELETE 
    USING (auth.uid()::text = user_id);

-- Update triggers
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_student_family_info_modtime ON student_family_info;
CREATE TRIGGER update_student_family_info_modtime
BEFORE UPDATE ON student_family_info
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_student_past_qualifications_modtime ON student_past_qualifications;
CREATE TRIGGER update_student_past_qualifications_modtime
BEFORE UPDATE ON student_past_qualifications
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_student_documents_modtime ON student_documents;
CREATE TRIGGER update_student_documents_modtime
BEFORE UPDATE ON student_documents
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();


--- File: SUPABASE_TIMETABLE_MIGRATION.sql ---
-- ==============================================================================
-- WEEKLY TIMETABLE MODULE MIGRATION
-- Description: Creates timetable_slots (regular weekly schedule) and
--              extra_lectures (one-off additional lectures)
-- ==============================================================================

-- 1. Regular weekly timetable slots
CREATE TABLE IF NOT EXISTS timetable_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    division_id UUID NOT NULL,
    day TEXT NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject TEXT NOT NULL,
    teacher_name TEXT,
    teacher_id VARCHAR(255),            -- Mongo User ID of teacher
    room TEXT,                           -- Room / Lab number
    type TEXT DEFAULT 'lecture' CHECK (type IN ('lecture', 'lab', 'tutorial', 'practical')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent duplicate slots: same division + day + time = blocked
CREATE UNIQUE INDEX IF NOT EXISTS idx_timetable_no_dup
    ON timetable_slots (division_id, day, start_time);

-- One timetable per division constraint (enforced at slot level)
CREATE INDEX IF NOT EXISTS idx_timetable_org ON timetable_slots(org_id);
CREATE INDEX IF NOT EXISTS idx_timetable_division ON timetable_slots(division_id);
CREATE INDEX IF NOT EXISTS idx_timetable_day ON timetable_slots(day);
CREATE INDEX IF NOT EXISTS idx_timetable_teacher ON timetable_slots(teacher_id);

-- 2. Extra lectures (one-off, date-specific)
CREATE TABLE IF NOT EXISTS extra_lectures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    division_id UUID NOT NULL,
    date DATE NOT NULL,                  -- Specific date (not recurring)
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject TEXT NOT NULL,
    teacher_name TEXT,
    teacher_id VARCHAR(255),
    room TEXT,
    added_by VARCHAR(255),               -- Who created this
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_extra_org ON extra_lectures(org_id);
CREATE INDEX IF NOT EXISTS idx_extra_division ON extra_lectures(division_id);
CREATE INDEX IF NOT EXISTS idx_extra_date ON extra_lectures(date);

-- Auto-update trigger for timetable_slots
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_timetable_modtime') THEN
        CREATE FUNCTION update_timetable_modtime()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
    END IF;
END
$$;

CREATE TRIGGER update_timetable_slots_modtime
    BEFORE UPDATE ON timetable_slots
    FOR EACH ROW EXECUTE FUNCTION update_timetable_modtime();


--- File: update_meetings.sql ---
��A L T E R   T A B L E   m e e t i n g s   A D D   C O L U M N   d e s c r i p t i o n   T E X T ;  
 

--- File: add_subscriber_timestamps.sql ---
-- Add missing timestamp columns to the blog_subscribers table
ALTER TABLE blog_subscribers
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Backfill created_at for existing users (so they don't break the charts)
-- We'll just set it to now() since we don't know when they subscribed, 
-- or we can leave it as now() because of the DEFAULT clause above which automatically fills existing rows in Postgres.


--- File: supabase-queue-migration.sql ---
-- ═══════════════════════════════════════════════════════════════
-- Email Notification Queue Table
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS email_notification_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_type TEXT NOT NULL CHECK (document_type IN ('post', 'changelogEntry')),
  document_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'skipped')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  
  UNIQUE(document_id)
);

-- Fast lookup for cron job
CREATE INDEX IF NOT EXISTS idx_queue_pending ON email_notification_queue(status, created_at) 
  WHERE status IN ('pending', 'failed');

-- Prevent stale "processing" rows (auto-reset after 10 min)
CREATE INDEX IF NOT EXISTS idx_queue_processing ON email_notification_queue(status, processed_at) 
  WHERE status = 'processing';


--- File: supabase_article_feedback_setup.sql ---
CREATE TABLE IF NOT EXISTS help_article_feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL,
  is_helpful boolean NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Note: In a real Supabase setup, you might want to add RLS (Row Level Security)
-- allowing public inserts but restricting selects.


`
