-- Create the ai_agent_reviews table for storing AI Chat feedback
CREATE TABLE public.ai_agent_reviews (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id text NOT NULL,
    user_email text NOT NULL,
    type text NOT NULL CHECK (type IN ('up', 'down')),
    feedback_text text,
    file_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Index for faster querying in the Super Admin dashboard
CREATE INDEX idx_ai_agent_reviews_created_at ON public.ai_agent_reviews (created_at DESC);
CREATE INDEX idx_ai_agent_reviews_type ON public.ai_agent_reviews (type);

-- Allow authenticated users to insert reviews, but only super admins to select
-- (Assuming standard Row Level Security or application-level security)
-- For simplicity, if RLS is not strictly enforced on this table, the backend API will handle auth.
