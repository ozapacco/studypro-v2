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
