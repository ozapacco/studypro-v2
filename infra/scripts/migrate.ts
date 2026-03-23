import { db } from '../src/lib/db';

async function migrate() {
  console.log('Running migrations...');
  
  await db.query(`
    CREATE TABLE IF NOT EXISTS questionSessions (
      id SERIAL PRIMARY KEY,
      date TIMESTAMP NOT NULL,
      subject VARCHAR(100) NOT NULL,
      platform VARCHAR(50) NOT NULL,
      totalQuestions INTEGER NOT NULL,
      correctAnswers INTEGER NOT NULL,
      errorTags TEXT[],
      canonicalTopics TEXT[],
      perceivedDifficulty INTEGER,
      errorType VARCHAR(50),
      sessionMode VARCHAR(50),
      durationMinutes INTEGER,
      notes TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  await db.query(`
    CREATE TABLE IF NOT EXISTS exams (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      examDate DATE NOT NULL,
      cutoffScore DECIMAL(5,2),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  await db.query(`
    CREATE TABLE IF NOT EXISTS subjects (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      weight DECIMAL(5,2) NOT NULL,
      targetAccuracy DECIMAL(5,2) NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  console.log('✓ Migrations completed');
}

migrate().catch(console.error);
