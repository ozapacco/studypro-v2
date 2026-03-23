import type { Request, Response } from 'express';
import { generateDailyMission, getDailyStats, recalculatePriorities } from '../../lib/engines/planner';
import { getActiveRecoveries, getRecoveryStats } from '../../lib/engines/recovery';
import { getCardStatistics } from '../../lib/engines/fsrs';
import { db } from '../../lib/db';

export async function getDashboard(req: Request, res: Response): Promise<void> {
  try {
    const stats = getDailyStats();
    const cardStats = getCardStatistics();
    const mission = generateDailyMission();
    const priorities = recalculatePriorities();
    const activeRecoveries = getActiveRecoveries();
    const recoveryStats = getRecoveryStats();
    
    const settings = db.findOne<{ studyPhase: string; targetScore: number; dailyGoal: number }>('user_settings', 'default') || {
      studyPhase: 'base',
      targetScore: 70,
      dailyGoal: 20,
    };
    
    const healthScore = calculateHealthScore(stats, cardStats, recoveryStats);
    
    res.json({
      health: {
        score: healthScore,
        status: healthScore > 70 ? 'good' : healthScore > 40 ? 'warning' : 'critical',
        factors: {
          reviewCoverage: cardStats.dueToday > 0 ? Math.min(100, (stats.reviewCards / cardStats.dueToday) * 100) : 100,
          newCardsRatio: stats.totalCards > 0 ? (stats.newCards / stats.totalCards) * 100 : 0,
          recoveryActive: recoveryStats.active > 0,
          streakDays: stats.streakDays,
        },
      },
      mission: mission,
      priorities: priorities.slice(0, 10),
      activeRecoveries: activeRecoveries.length,
      settings: settings,
      stats: {
        ...stats,
        ...cardStats,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get dashboard' });
  }
}

export async function getMission(req: Request, res: Response): Promise<void> {
  try {
    const mission = generateDailyMission();
    
    res.json(mission);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get mission' });
  }
}

function calculateHealthScore(
  stats: ReturnType<typeof getDailyStats>,
  cardStats: ReturnType<typeof getCardStatistics>,
  recoveryStats: ReturnType<typeof getRecoveryStats>
): number {
  let score = 100;
  
  if (cardStats.dueToday > 0 && stats.reviewCards < cardStats.dueToday * 0.5) {
    score -= 20;
  }
  
  if (stats.totalCards > 0 && (stats.newCards / stats.totalCards) > 0.3) {
    score -= 15;
  }
  
  if (stats.averageAccuracy < 50) {
    score -= 25;
  } else if (stats.averageAccuracy < 70) {
    score -= 10;
  }
  
  if (recoveryStats.active > 2) {
    score -= 10;
  }
  
  if (stats.streakDays < 2) {
    score -= 15;
  } else if (stats.streakDays < 5) {
    score -= 5;
  }
  
  if (cardStats.learningCards === 0 && cardStats.reviewCards === 0) {
    score -= 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

export async function getStudyPhase(req: Request, res: Response): Promise<void> {
  try {
    const settings = db.findOne<{ studyPhase: string; targetScore: number; dailyGoal: number }>('user_settings', 'default') || {
      studyPhase: 'base',
      targetScore: 70,
      dailyGoal: 20,
    };
    
    res.json({
      phase: settings.studyPhase,
      targetScore: settings.targetScore,
      dailyGoal: settings.dailyGoal,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get study phase' });
  }
}