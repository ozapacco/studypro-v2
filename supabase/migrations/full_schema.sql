-- ============================================
-- STUDYPRO v2.1 - Initial Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE platform AS ENUM ('qconcursos', 'tec', 'other');
CREATE TYPE error_type AS ENUM ('forgot', 'confused', 'never_learned');
CREATE TYPE session_mode AS ENUM ('random', 'focused_topic', 'partial_mock');
CREATE TYPE card_state AS ENUM ('new', 'learning', 'review', 'relearning');
CREATE TYPE card_origin AS ENUM ('manual', 'session_error', 'imported', 'mock_exam_error');
CREATE TYPE study_phase AS ENUM ('base', 'intensification', 'final');
CREATE TYPE recovery_status AS ENUM ('open', 'in_progress', 'done', 'archived');
CREATE TYPE recovery_reason AS ENUM ('recurrent_error', 'mock_exam', 'never_learned', 'low_accuracy');

-- ============================================
-- USERS (extends Supabase auth.users)
-- ============================================

CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    target_accuracy INTEGER DEFAULT 70,
    daily_time_minutes INTEGER DEFAULT 180,
    preferred_platform platform DEFAULT 'qconcursos',
    dark_mode BOOLEAN DEFAULT false,
    fsrs_max_interval INTEGER DEFAULT 365,
    fsrs_daily_limit INTEGER DEFAULT 200,
    fsrs_daily_new INTEGER DEFAULT 20,
    min_sample_size INTEGER DEFAULT 10,
    recurrence_threshold INTEGER DEFAULT 3,
    notify_daily BOOLEAN DEFAULT true,
    notify_time TIME DEFAULT '08:00',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EXAMS (Concurso alvo)
-- ============================================

CREATE TABLE public.exams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    organization TEXT,
    exam_date DATE,
    registration_deadline DATE,
    cutoff_score NUMERIC(5,2),
    status study_phase DEFAULT 'base',
    weeks_until_exam INTEGER GENERATED ALWAYS AS (
        CASE WHEN exam_date IS NOT NULL 
        THEN EXTRACT(WEEK FROM (exam_date - CURRENT_DATE)) 
        ELSE NULL END
    ) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exams_user ON public.exams(user_id);
CREATE INDEX idx_exams_date ON public.exams(exam_date);

-- ============================================
-- SUBJECTS (Matérias/Disciplinas)
-- ============================================

CREATE TABLE public.subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    short_name TEXT,
    weight INTEGER DEFAULT 50 CHECK (weight >= 0 AND weight <= 100),
    current_accuracy NUMERIC(5,2) DEFAULT 0,
    confidence_score NUMERIC(3,2),
    target_accuracy INTEGER DEFAULT 70,
    current_priority NUMERIC(5,2) DEFAULT 0,
    weekly_accuracy_history JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, name)
);

CREATE INDEX idx_subjects_exam ON public.subjects(exam_id);
CREATE INDEX idx_subjects_priority ON public.subjects(current_priority DESC);

-- ============================================
-- QUESTION SESSIONS
-- ============================================

CREATE TABLE public.question_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    platform platform NOT NULL,
    total_questions INTEGER NOT NULL CHECK (total_questions > 0),
    correct_answers INTEGER NOT NULL CHECK (correct_answers >= 0 AND correct_answers <= total_questions),
    error_rate NUMERIC(5,2) GENERATED ALWAYS AS (
        CASE WHEN total_questions > 0 
        THEN ((total_questions - correct_answers)::NUMERIC / total_questions * 100)
        ELSE 0 END
    ) STORED,
    error_tags TEXT[] DEFAULT '{}',
    canonical_topics TEXT[] DEFAULT '{}',
    perceived_difficulty SMALLINT CHECK (perceived_difficulty BETWEEN 1 AND 5),
    error_type error_type,
    session_mode session_mode,
    duration_minutes INTEGER,
    notes TEXT,
    session_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON public.question_sessions(user_id);
CREATE INDEX idx_sessions_date ON public.question_sessions(session_date DESC);
CREATE INDEX idx_sessions_subject ON public.question_sessions(subject);
CREATE INDEX idx_sessions_user_date ON public.question_sessions(user_id, session_date DESC);

-- ============================================
-- TOPIC PERFORMANCE
-- ============================================

CREATE TABLE public.topic_performance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    canonical_topic TEXT NOT NULL,
    aliases TEXT[] DEFAULT '{}',
    attempts INTEGER DEFAULT 0,
    errors INTEGER DEFAULT 0,
    accuracy NUMERIC(5,2) GENERATED ALWAYS AS (
        CASE WHEN attempts > 0 
        THEN ((attempts - errors)::NUMERIC / attempts * 100)
        ELSE 0 END
    ) STORED,
    rolling_accuracy_7d NUMERIC(5,2),
    rolling_accuracy_30d NUMERIC(5,2),
    recurrence_score INTEGER DEFAULT 0,
    current_priority NUMERIC(5,2) DEFAULT 0,
    in_recovery BOOLEAN DEFAULT false,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, subject, canonical_topic)
);

CREATE INDEX idx_topic_user ON public.topic_performance(user_id);
CREATE INDEX idx_topic_subject ON public.topic_performance(subject);
CREATE INDEX idx_topic_priority ON public.topic_performance(current_priority DESC);
CREATE INDEX idx_topic_recovery ON public.topic_performance(in_recovery) WHERE in_recovery = true;

-- ============================================
-- TOPIC DICTIONARY (Normalização)
-- ============================================

CREATE TABLE public.topic_dictionary (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    subject TEXT NOT NULL,
    canonical TEXT NOT NULL,
    aliases TEXT[] DEFAULT '{}',
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    verified BOOLEAN DEFAULT false,
    merged_into UUID REFERENCES public.topic_dictionary(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(subject, canonical)
);

CREATE INDEX idx_dict_subject ON public.topic_dictionary(subject);
CREATE INDEX idx_dict_canonical ON public.topic_dictionary(canonical);

-- ============================================
-- CARDS (FSRS)
-- ============================================

CREATE TABLE public.cards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    topic TEXT,
    canonical_topic TEXT,
    front TEXT NOT NULL,
    back TEXT,
    origin card_origin DEFAULT 'manual',
    origin_session_id UUID REFERENCES public.question_sessions(id) ON DELETE SET NULL,
    origin_mock_exam_id UUID,
    error_context TEXT,
    auto_generated BOOLEAN DEFAULT false,
    
    -- FSRS fields
    stability NUMERIC(10,2) DEFAULT 0,
    difficulty NUMERIC(3,2) DEFAULT 2.5 CHECK (difficulty BETWEEN 1 AND 5),
    state card_state DEFAULT 'new',
    due_date TIMESTAMPTZ DEFAULT NOW(),
    interval INTEGER DEFAULT 0,
    lapses INTEGER DEFAULT 0,
    
    -- Learning/Relearning steps
    learning_step INTEGER DEFAULT 0,
    relearning_step INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cards_user ON public.cards(user_id);
CREATE INDEX idx_cards_due ON public.cards(user_id, due_date) WHERE state IN ('review', 'learning', 'relearning');
CREATE INDEX idx_cards_state ON public.cards(state);
CREATE INDEX idx_cards_subject ON public.cards(subject);

-- ============================================
-- REVIEW LOGS
-- ============================================

CREATE TABLE public.review_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    response_time_ms INTEGER,
    reviewed_at TIMESTAMPTZ DEFAULT NOW(),
    previous_interval INTEGER,
    previous_ease NUMERIC(3,2),
    new_interval INTEGER,
    new_ease NUMERIC(3,2)
);

CREATE INDEX idx_review_card ON public.review_logs(card_id);
CREATE INDEX idx_review_user ON public.review_logs(user_id);
CREATE INDEX idx_review_date ON public.review_logs(reviewed_at);

-- ============================================
-- MOCK EXAMS
-- ============================================

CREATE TABLE public.mock_exams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    exam_date DATE NOT NULL,
    platform TEXT,
    total_score NUMERIC(5,2) NOT NULL,
    max_score NUMERIC(5,2) NOT NULL,
    cutoff_score NUMERIC(5,2),
    score_difference NUMERIC(5,2) GENERATED ALWAYS AS (total_score - cutoff_score) STORED,
    by_subject JSONB DEFAULT '[]'::JSONB,
    analysis JSONB DEFAULT '{"strong": [], "attention": [], "critical": []}'::JSONB,
    critical_topics TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mock_user ON public.mock_exams(user_id);
CREATE INDEX idx_mock_date ON public.mock_exams(exam_date DESC);

-- ============================================
-- RECOVERY QUEUE
-- ============================================

CREATE TABLE public.recovery_queue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    canonical_topic TEXT NOT NULL,
    reason recovery_reason NOT NULL,
    status recovery_status DEFAULT 'open',
    suggested_actions JSONB DEFAULT '[]'::JSONB,
    created_from_session_id UUID REFERENCES public.question_sessions(id) ON DELETE SET NULL,
    created_from_mock_exam_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recovery_user ON public.recovery_queue(user_id);
CREATE INDEX idx_recovery_status ON public.recovery_queue(status);
CREATE INDEX idx_recovery_topic ON public.recovery_queue(canonical_topic);

-- ============================================
-- USER SETTINGS
-- ============================================

CREATE TABLE public.user_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    daily_time_available INTEGER DEFAULT 180,
    preferred_platform platform DEFAULT 'qconcursos',
    dark_mode BOOLEAN DEFAULT false,
    target_accuracy INTEGER DEFAULT 70,
    fsrs_maximum_interval INTEGER DEFAULT 365,
    daily_review_limit INTEGER DEFAULT 200,
    notify_daily BOOLEAN DEFAULT true,
    notify_time TIME DEFAULT '08:00',
    min_sample_for_accuracy INTEGER DEFAULT 10,
    recurrence_threshold INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON public.exams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.question_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_topic_perf_updated_at BEFORE UPDATE ON public.topic_performance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON public.cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_recovery_updated_at BEFORE UPDATE ON public.recovery_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- All other tables: users can only access their own data
CREATE POLICY "Users can CRUD own exams" ON public.exams
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own subjects" ON public.subjects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.exams 
            WHERE exams.id = subjects.exam_id 
            AND exams.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can CRUD own sessions" ON public.question_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own topic performance" ON public.topic_performance
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own cards" ON public.cards
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own review logs" ON public.review_logs
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own mock exams" ON public.mock_exams
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own recovery queue" ON public.recovery_queue
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own settings" ON public.user_settings
    FOR ALL USING (auth.uid() = user_id);
-- ============================================
-- Predefined Exams Template
-- ============================================

CREATE TABLE public.exam_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    organization TEXT,
    subjects JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert predefined templates
INSERT INTO public.exam_templates (name, organization, subjects) VALUES
(
    'Polícia Civil SC',
    'PCSC',
    '[
        {"name": "Direito Penal", "weight": 25},
        {"name": "Direito Processual Penal", "weight": 20},
        {"name": "Direito Constitucional", "weight": 15},
        {"name": "Direito Administrativo", "weight": 10},
        {"name": "Português", "weight": 15},
        {"name": "Informática", "weight": 15}
    ]'::JSONB
),
(
    'Polícia Militar SP',
    'PMSP',
    '[
        {"name": "Matemática", "weight": 20},
        {"name": "Português", "weight": 20},
        {"name": "Constitucional", "weight": 15},
        {"name": "Legislação Militar", "weight": 25},
        {"name": "Atualidades", "weight": 20}
    ]'::JSONB
),
(
    'Guarda Municipal',
    'GM',
    '[
        {"name": "Constitucional", "weight": 25},
        {"name": "Penal", "weight": 20},
        {"name": "Legislação Municipal", "weight": 20},
        {"name": "Português", "weight": 20},
        {"name": "Raciocínio Lógico", "weight": 15}
    ]'::JSONB
),
(
    'Polícia Penal',
    'DEPEN',
    '[
        {"name": "Direito Penal", "weight": 25},
        {"name": "Execução Penal", "weight": 20},
        {"name": "Constitucional", "weight": 15},
        {"name": "Português", "weight": 20},
        {"name": "Atualidades", "weight": 20}
    ]'::JSONB
);

-- Function to create exam from template
CREATE OR REPLACE FUNCTION create_exam_from_template(
    p_template_id UUID,
    p_exam_date DATE,
    p_cutoff_score NUMERIC DEFAULT 70
)
RETURNS UUID AS $$
DECLARE
    v_exam_id UUID;
    v_subject JSONB;
BEGIN
    -- Create exam
    INSERT INTO public.exams (user_id, name, organization, exam_date, cutoff_score)
    SELECT 
        auth.uid(),
        name || ' - ' || p_exam_date::TEXT,
        organization,
        p_exam_date,
        p_cutoff_score
    FROM public.exam_templates
    WHERE id = p_template_id
    RETURNING id INTO v_exam_id;

    -- Create subjects from template
    FOR v_subject IN 
        SELECT * FROM jsonb_array_elements(
            (SELECT subjects FROM public.exam_templates WHERE id = p_template_id)
        )
    LOOP
        INSERT INTO public.subjects (exam_id, name, weight)
        VALUES (v_exam_id, v_subject->>'name', (v_subject->>'weight')::INTEGER);
    END LOOP;

    RETURN v_exam_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ============================================
-- Seed Topic Dictionary (Direito Penal como exemplo)
-- ============================================

INSERT INTO public.topic_dictionary (subject, canonical, aliases) VALUES
-- Direito Penal Geral
('Direito Penal', 'Princípios do Direito Penal', ARRAY['principios', 'principios do direito penal', 'garantismo']),
('Direito Penal', 'Teoria da Norma Penal', ARRAY['teoria da norma', 'norma penal', 'estrutura da norma']),
('Direito Penal', 'Teoria do Crime', ARRAY['teoria do crime', 'conceito de crime', 'crime']),
('Direito Penal', 'Tipo Penal', ARRAY['tipo', 'tipo penal', 'tipicidade']),
('Direito Penal', 'Ilícito Penal', ARRAY['ilicito', 'ilicito penal', 'antijuridicidade']),
('Direito Penal', 'Culpabilidade', ARRAY['culpabilidade', 'dolo', 'culpa']),
('Direito Penal', 'Consumação e Tentativa', ARRAY['consumacao', 'tentativa', 'conatus', 'crime consumed', 'crime tentado']),
('Direito Penal', 'Desistência Voluntária', ARRAY['desistencia', 'desistência voluntária', 'arrependimento']),
('Direito Penal', 'Arrependimento Eficaz', ARRAY['arrependimento eficaz']),
('Direito Penal', 'Arrependimento Posterior', ARRAY['arrependimento posterior', 'art. 16 cp']),
('Direito Penal', 'Erro de Tipo', ARRAY['erro de tipo', 'erro essencial', 'erro', 'desconhecimento da lei']),
('Direito Penal', 'Erro de Proibição', ARRAY['erro de proibicao', 'erro sobre a ilicitude', 'escusa de conhecimento']),
('Direito Penal', 'Concurso de Crimes', ARRAY['concurso de crimes', 'concurso de pessoas', 'crime continuado']),
('Direito Penal', 'Concurso de Pessoas', ARRAY['bando', 'quadrilha', 'participacao', 'partícipe', 'co-autoria']),

-- Crimes Contra a Pessoa
('Direito Penal', 'Homicídio', ARRAY['homicidio', 'homicídio simples', 'assassinato']),
('Direito Penal', 'Induzimento ao Suicídio', ARRAY['induzimento ao suicídio', 'suicidio assistido']),
('Direito Penal', 'Aborto', ARRAY['aborto', 'interrupção da gravidez']),
('Direito Penal', 'Lesão Corporal', ARRAY['lesao corporal', 'vias de fato', 'violência doméstica']),
('Direito Penal', 'Periclitação da Vida ou Saúde', ARRAY['periclitacao', 'exposição', 'abandono']),

-- Crimes Contra o Patrimônio
('Direito Penal', 'Furto', ARRAY['furto', 'subtração', 'roubo', 'latrocínio']),
('Direito Penal', 'Roubo', ARRAY['roubo', 'extorsão', 'sequestro']),
('Direito Penal', 'Estelionato', ARRAY['estelionato', 'fraude', 'engano']),
('Direito Penal', 'Apropriação Indébita', ARRAY['apropriacao indébita', 'infidelidade']),
('Direito Penal', 'Extorsão', ARRAY['extorsao', 'chantagem']),
('Direito Penal', 'Dano', ARRAY['dano', 'vandalismo', 'destruição']),
('Direito Penal', 'Receptação', ARRAY['receptacao', 'negócio jurídico']),

-- Crimes Sexuais
('Direito Penal', 'Crimes Sexuais', ARRAY['estupro', 'violência sexual', 'assedio', 'assedio sexual']),
('Direito Penal', 'Prescrição', ARRAY['prescricao', 'decadência']),

-- Direito Penal Especial
('Direito Penal', 'Crimes Hediondos', ARRAY['hediondo', 'crimes hediondos', 'tortura', 'tráfico de pessoas']),
('Direito Penal', 'Crimes de Tortura', ARRAY['tortura', 'tratamento degradante']),
('Direito Penal', 'Crimes Ambientais', ARRAY['ambiental', 'crimes ambientais', 'fauna', 'flora']),
('Direito Penal', 'Crimes contra a Administração Pública', ARRAY['administracao publica', 'corrupção', 'prevaricação']),
('Direito Penal', 'Crimes Falimentares', ARRAY['falencia', 'falimentares', 'insolvência']),

-- Legítima Defesa e Excludentes
('Direito Penal', 'Legítima Defesa', ARRAY['legitima defesa', 'excludente de ilicitude', 'defesa pessoal']),
('Direito Penal', 'Estado de Necessidade', ARRAY['estado de necessidade', 'emergência']),
('Direito Penal', 'Estrito Cumprimento de Dever Legal', ARRAY['cumprimento de dever', 'dever legal']),
('Direito Penal', 'Exercício Regular de Direito', ARRAY['exercicio regular', 'direito']),
('Direito Penal', 'Consentimento do Ofendido', ARRAY['consentimento', 'vítima']);
