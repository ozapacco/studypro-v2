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
