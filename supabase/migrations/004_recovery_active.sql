-- F2.3: Fila de Recuperação ATIVA

CREATE TYPE recovery_status AS ENUM ('open', 'in_progress', 'done', 'archived');
CREATE TYPE recovery_reason AS ENUM ('recurrent_error', 'mock_exam', 'never_learned', 'low_accuracy');

CREATE TABLE recovery_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    canonical_topic TEXT NOT NULL,
    reason recovery_reason NOT NULL,
    status recovery_status NOT NULL DEFAULT 'open',
    trigger_count INT DEFAULT 1,
    accuracy_history NUMERIC[] DEFAULT '{}',
    plan TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,

    UNIQUE(user_id, subject, canonical_topic, status) 
    -- Evita múltiplas entradas abertas para o mesmo tópico
);

-- RLS
ALTER TABLE recovery_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own recovery entries" 
ON recovery_entries FOR ALL USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER set_recovery_updated_at
BEFORE UPDATE ON recovery_entries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
