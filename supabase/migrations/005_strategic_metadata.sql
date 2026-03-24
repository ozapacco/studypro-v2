-- Add metadata for strategic planning
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS importance INTEGER DEFAULT 50 CHECK (importance >= 0 AND importance <= 100);

-- Add importance to global topic dictionary (frequency in exam)
ALTER TABLE public.topic_dictionary ADD COLUMN IF NOT EXISTS importance INTEGER DEFAULT 50 CHECK (importance >= 0 AND importance <= 100);
ALTER TABLE public.topic_dictionary ADD COLUMN IF NOT EXISTS general_difficulty INTEGER DEFAULT 50 CHECK (general_difficulty >= 0 AND general_difficulty <= 100);

-- Add personal difficulty to user topic performance
ALTER TABLE public.topic_performance ADD COLUMN IF NOT EXISTS personal_difficulty INTEGER DEFAULT 50 CHECK (personal_difficulty >= 0 AND personal_difficulty <= 100);
ALTER TABLE public.topic_performance ADD COLUMN IF NOT EXISTS weight_override INTEGER; -- Allow manual priority override per topic
