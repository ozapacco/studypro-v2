export interface Session {
  id: string
  title: string
  subject: string
  duration: number
  date: string
  status: 'completed' | 'in-progress' | 'scheduled'
  score?: number
  topics: string[]
}

export interface Review {
  id: string
  sessionId: string
  sessionTitle: string
  date: string
  accuracy: number
  correct: number
  total: number
  timeSpent: number
  criticalTopics: string[]
}

export interface MockExam {
  id: string
  title: string
  date: string
  score: number
  duration: number
  questionsCount: number
  status: 'completed' | 'in-progress' | 'scheduled'
}

export interface Stats {
  totalSessions: number
  totalReviews: number
  totalStudyTime: number
  averageAccuracy: number
  weeklyProgress: { day: string; hours: number }[]
  topicPerformance: { topic: string; accuracy: number }[]
}

export interface DashboardData {
  mission: {
    current: number
    target: number
    streak: number
  }
  health: {
    focusLevel: number
   疲劳度: number
    memoryStrength: number
  }
  recentSessions: Session[]
  upcomingReviews: Review[]
}

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}
