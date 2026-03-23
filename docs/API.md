# StudyPro API Reference

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "targetExam": "PF",
  "targetRole": "Delegado"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "jwt-token"
}
```

#### POST /auth/login
Login user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "jwt-token"
}
```

### Dashboard

#### GET /dashboard
Get daily mission and health metrics.

**Response:**
```json
{
  "mission": {
    "dailyGoal": 150,
    "completed": 45,
    "remaining": 105,
    "tasks": [
      {
        "type": "review",
        "topic": "Direito Penal",
        "cards": 20,
        "priority": "high"
      },
      {
        "type": "study",
        "topic": "Legislação Especial",
        "duration": 30,
        "priority": "medium"
      }
    ]
  },
  "health": {
    "streak": 7,
    "retentionRate": 0.85,
    "weeklyProgress": 0.72,
    "weakTopics": 3
  },
  "nextReview": "2024-01-15T14:00:00Z"
}
```

### Sessions

#### POST /sessions
Register a study session.

**Request Body:**
```json
{
  "type": "study",
  "duration": 45,
  "topics": ["Direito Penal", "Legislação Especial"],
  "questionsAttempted": 25,
  "correctAnswers": 18,
  "notes": "session notes"
}
```

**Response:**
```json
{
  "id": "uuid",
  "type": "study",
  "duration": 45,
  "topics": ["Direito Penal", "Legislação Especial"],
  "questionsAttempted": 25,
  "correctAnswers": 18,
  "accuracy": 0.72,
  "createdAt": "2024-01-15T10:00:00Z"
}
```

#### GET /sessions
Get session history.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

**Response:**
```json
{
  "sessions": [
    {
      "id": "uuid",
      "type": "study",
      "duration": 45,
      "topics": ["Direito Penal"],
      "accuracy": 0.72,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "pages": 5
}
```

### Reviews (FSRS)

#### GET /reviews/due
Get cards due for review.

**Query Parameters:**
- `limit` (optional): Max cards to return (default: 50)

**Response:**
```json
{
  "dueCards": [
    {
      "id": "uuid",
      "front": "O que é crime de perigo abstrato?",
      "back": "É aquele em que a lei presume o perigo apenas pela ação, sem necessidade de resultado",
      "topic": "Direito Penal",
      "subtopic": "Teoria do Crime",
      "dueDate": "2024-01-15T14:00:00Z",
      "interval": 1,
      "easeFactor": 2.5
    }
  ],
  "total": 25
}
```

#### POST /reviews/:id
Submit review result for a card.

**Request Body:**
```json
{
  "quality": 4,
  "responseTime": 15000
}
```

**Response:**
```json
{
  "card": {
    "id": "uuid",
    "interval": 4,
    "easeFactor": 2.6,
    "nextReview": "2024-01-19T14:00:00Z"
  },
  "status": "success"
}
```

**Quality Ratings:**
- 0: Complete blackout
- 1: Incorrect response
- 2: Incorrect, but recognized answer
- 3: Correct with difficulty
- 4: Correct with hesitation
- 5: Perfect response

### Mock Exams

#### POST /mock-exams
Register a mock exam.

**Request Body:**
```json
{
  "examName": "Simulado PF 2024",
  "totalQuestions": 120,
  "correctAnswers": 85,
  "duration": 240,
  "subjects": [
    {
      "name": "Direito Penal",
      "correct": 25,
      "total": 30
    },
    {
      "name": "Direito Constitucional",
      "correct": 20,
      "total": 25
    }
  ]
}
```

**Response:**
```json
{
  "id": "uuid",
  "score": 70.8,
  "grade": "B",
  "diagnosis": {
    "strongTopics": ["Direito Penal"],
    "weakTopics": ["Direito Constitucional"],
    "criticalGaps": [
      {
        "topic": "Princípios Constitucionais",
        "impact": "high"
      }
    ]
  },
  "createdAt": "2024-01-15T10:00:00Z"
}
```

#### GET /mock-exams
Get mock exam history.

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```json
{
  "mockExams": [
    {
      "id": "uuid",
      "examName": "Simulado PF 2024",
      "score": 70.8,
      "grade": "B",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 10,
  "page": 1,
  "pages": 1
}
```

### Topics

#### GET /topics
Get all topics with performance metrics.

**Query Parameters:**
- `status` (optional): Filter by status (strong/weak/neutral)
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```json
{
  "topics": [
    {
      "id": "uuid",
      "name": "Direito Penal",
      "category": "Legal",
      "mastery": 0.75,
      "status": "neutral",
      "totalCards": 150,
      "dueCards": 20,
      "averageAccuracy": 0.72,
      "lastStudied": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "pages": 3
}
```

#### GET /topics/:id
Get detailed topic information.

**Response:**
```json
{
  "id": "uuid",
  "name": "Direito Penal",
  "category": "Legal",
  "mastery": 0.75,
  "performance": {
    "weekly": { "accuracy": 0.72, "sessions": 3 },
    "monthly": { "accuracy": 0.68, "sessions": 12 }
  },
  "subtopics": [
    {
      "name": "Teoria do Crime",
      "mastery": 0.65,
      "cards": 45
    }
  ],
  "recoveryPriority": "medium"
}
```

### Statistics

#### GET /stats/overview
Get overall statistics.

**Response:**
```json
{
  "overview": {
    "totalSessions": 150,
    "totalTime": 7500,
    "averageAccuracy": 0.72,
    "streak": 7,
    "longestStreak": 21
  },
  "weekly": {
    "sessions": 12,
    "time": 540,
    "accuracy": 0.75,
    "progress": 0.15
  },
  "monthly": {
    "sessions": 45,
    "totalTime": 2250,
    "accuracy": 0.70,
    "progress": 0.45
  },
  "goals": {
    "daily": { "target": 150, "current": 45 },
    "weekly": { "target": 1000, "current": 720 }
  }
}
```

#### GET /stats/progress
Get detailed progress metrics.

**Query Parameters:**
- `period` (optional): weekly/monthly/all (default: monthly)

**Response:**
```json
{
  "progress": [
    {
      "date": "2024-01-15",
      "sessions": 3,
      "time": 135,
      "accuracy": 0.74,
      "cardsReviewed": 45
    }
  ],
  "trend": "improving",
  "projectedScore": 72
}
```

### Recovery Queue

#### GET /recovery
Get topics in recovery queue.

**Response:**
```json
{
  "queue": [
    {
      "topicId": "uuid",
      "topicName": "Direito Constitucional",
      "priority": "high",
      "reason": "critical_gaps",
      "recommendedAction": "intensive_review",
      "estimatedTime": 60
    }
  ]
}
```

#### POST /recovery/:topicId/start
Start recovery session for a topic.

**Response:**
```json
{
  "sessionId": "uuid",
  "cards": [...],
  "duration": 30,
  "focusAreas": [...]
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation Error",
  "message": "Invalid input",
  "details": [...]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "Something went wrong"
}
```

## Rate Limits
- Default: 100 requests per minute
- Auth endpoints: 10 requests per minute
- Review endpoints: 200 requests per minute