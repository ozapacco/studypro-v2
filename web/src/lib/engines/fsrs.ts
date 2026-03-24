import { CardState, ReviewRating } from '@/types';

/**
 * STUDYPRO FSRS ENGINE v2.2
 * Lógica pura para agendamento de repetição espaçada.
 */

export interface FSRSParams {
  w: number[];
  requestRetention: number;
}

export const DEFAULT_FSRS_PARAMS: FSRSParams = {
  // Pesos padrão para estabilidade e dificuldade (baseado em Anki/FSRS v4)
  w: [0.4, 0.6, 2.4, 5.8, 4.9, 1.0, 1.1, 1.2, 0.7, 1.0], 
  requestRetention: 0.9,
};

// Intervalos para os passos de aprendizado (minutos)
const STEPS = [1, 10]; 

export interface FSRSResult {
  state: CardState;
  stability: number;
  difficulty: number;
  due_date: Date;
  interval: number;
}

/**
 * Calcula o próximo estado do card após uma revisão
 */
export function scheduleReview(
  card: {
    state: CardState;
    stability: number;
    difficulty: number;
    lapses: number;
    learning_step?: number;
    personal_difficulty?: number;
  },
  rating: ReviewRating,
  params: FSRSParams = DEFAULT_FSRS_PARAMS
): FSRSResult {
  const now = new Date();
  let { state, stability, difficulty, lapses, learning_step = 0, personal_difficulty = 50 } = card;

  // Fator de Dificuldade Pessoal (0.5 a 1.5)
  // Assuntos difíceis (>50) fazem o pdFactor ser > 1
  const pdFactor = 1 + (personal_difficulty - 50) / 100;

  // Lógica de Retenção Analítica
  if (rating === 1) { // ERREI
    lapses++;
    stability = params.w[0] * Math.pow(stability, params.w[1]) * (1 / pdFactor);
    difficulty = Math.min(5, difficulty + (params.w[2] * pdFactor));
    state = 'relearning';
    learning_step = 0;
  } else { // ACERTEI
    if (state === 'new' || state === 'learning' || state === 'relearning') {
      learning_step++;
      if (learning_step >= STEPS.length) {
        state = 'review';
        // Estabilidade inicial: menor se pdFactor for alto (assunto difícil)
        stability = params.w[3] * (rating === 4 ? 1.5 : 1) / pdFactor; 
      } else {
        state = 'learning';
        stability = 0.1; // Curta duração
      }
    } else {
      // Já era um card de revisão (Review State)
      const bonus = rating >= 3 ? params.w[4] : 1.0; // Bônus
      
      // Estabilidade cresce mais devagar para assuntos difíceis
      stability = stability * (1 + (params.w[5] * bonus * (5 - difficulty) / pdFactor));
      
      // Dificuldade cai mais devagar se o assunto é difícil
      difficulty = Math.max(1, Math.min(5, difficulty + (params.w[6] * (3 - rating) * pdFactor)));
    }
  }

  // Calcular próximo intervalo (em dias)
  const interval = calculateIntervalFromStability(stability, params.requestRetention);
  
  // Se for card em aprendizado, o intervalo é em minutos, não dias
  let dueDate: Date;
  if (state === 'learning' || state === 'relearning') {
      dueDate = new Date(now.getTime() + STEPS[Math.min(learning_step, STEPS.length -1)] * 60 * 1000);
  } else {
      dueDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
  }

  return {
    state,
    stability,
    difficulty,
    due_date: dueDate,
    interval: Math.round(interval)
  };
}

function calculateIntervalFromStability(stability: number, retention: number): number {
  if (stability <= 0) return 1;
  // Fórmula simplificada: Intervalo = Estabilidade * log(Retenção Desejada) / log(0.9)
  return Math.max(1, stability * (Math.log(retention) / Math.log(0.9)));
}