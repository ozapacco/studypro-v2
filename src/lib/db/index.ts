import Database from 'better-sqlite3';
import type {
  Question,
  QuestionSession,
  Card,
  Subject,
  RecoveryEntry,
  TopicPerformance,
  MockExam,
  UserSettings,
  OnboardingProgress,
} from '../models';

const DB_PATH = process.env.DB_PATH || './studypro.db';

export class DatabaseClient {
  private db: Database.Database;

  constructor(path: string = DB_PATH) {
    this.db = new Database(path);
    this.initialize();
  }

  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        platform TEXT NOT NULL,
        external_id TEXT,
        subject TEXT NOT NULL,
        topic TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        options TEXT NOT NULL,
        explanation TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        subject TEXT NOT NULL,
        topic TEXT NOT NULL,
        correct_count INTEGER DEFAULT 0,
        incorrect_count INTEGER DEFAULT 0,
        error_types TEXT,
        platform TEXT NOT NULL,
        source TEXT,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        duration INTEGER
      );

      CREATE TABLE IF NOT EXISTS session_questions (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        question_id TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(id),
        FOREIGN KEY (question_id) REFERENCES questions(id)
      );

      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        question_id TEXT NOT NULL,
        front TEXT NOT NULL,
        back TEXT NOT NULL,
        subject TEXT NOT NULL,
        topic TEXT NOT NULL,
        state TEXT NOT NULL,
        origin TEXT NOT NULL,
        interval INTEGER DEFAULT 0,
        ease REAL DEFAULT 2.5,
        due TEXT NOT NULL,
        due_interval INTEGER DEFAULT 0,
        due_date TEXT NOT NULL,
        reps INTEGER DEFAULT 0,
        lapses INTEGER DEFAULT 0,
        step INTEGER DEFAULT 0,
        due_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (question_id) REFERENCES questions(id)
      );

      CREATE TABLE IF NOT EXISTS subjects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        color TEXT,
        question_count INTEGER DEFAULT 0,
        accuracy REAL DEFAULT 0,
        last_studied TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS recoveries (
        id TEXT PRIMARY KEY,
        subject TEXT NOT NULL,
        topic TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT NOT NULL,
        card_ids TEXT NOT NULL,
        trigger_count INTEGER DEFAULT 0,
        accuracy_history TEXT,
        plan TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        completed_at TEXT
      );

      CREATE TABLE IF NOT EXISTS topic_performance (
        id TEXT PRIMARY KEY,
        subject TEXT NOT NULL,
        topic TEXT NOT NULL,
        total_questions INTEGER DEFAULT 0,
        correct_answers INTEGER DEFAULT 0,
        accuracy REAL DEFAULT 0,
        error_types TEXT,
        recurrence_score REAL DEFAULT 0,
        last_studied TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(subject, topic)
      );

      CREATE TABLE IF NOT EXISTS mock_exams (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        platform TEXT NOT NULL,
        external_id TEXT,
        subject TEXT NOT NULL,
        questions TEXT NOT NULL,
        score REAL,
        total_questions INTEGER NOT NULL,
        correct_answers INTEGER DEFAULT 0,
        duration INTEGER,
        taken_at TEXT NOT NULL,
        completed_at TEXT,
        post_impact_mode INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_settings (
        id TEXT PRIMARY KEY,
        daily_goal INTEGER DEFAULT 20,
        study_phase TEXT DEFAULT 'base',
        target_score REAL DEFAULT 70,
        preferred_platform TEXT,
        review_limit INTEGER DEFAULT 50,
        new_cards_limit INTEGER DEFAULT 10,
        theme TEXT DEFAULT 'light',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS onboarding_progress (
        id TEXT PRIMARY KEY,
        step INTEGER DEFAULT 0,
        selected_exams TEXT,
        selected_subjects TEXT,
        daily_goal INTEGER DEFAULT 20,
        target_score REAL DEFAULT 70,
        completed INTEGER DEFAULT 0,
        started_at TEXT NOT NULL,
        completed_at TEXT
      );

      CREATE TABLE IF NOT EXISTS topic_normalizations (
        id TEXT PRIMARY KEY,
        raw_tag TEXT NOT NULL,
        normalized_topic TEXT NOT NULL,
        subject TEXT NOT NULL,
        confidence REAL DEFAULT 1,
        created_at TEXT NOT NULL,
        UNIQUE(raw_tag, subject)
      );

      CREATE INDEX IF NOT EXISTS idx_cards_due ON cards(due_date);
      CREATE INDEX IF NOT EXISTS idx_cards_subject ON cards(subject);
      CREATE INDEX IF NOT EXISTS idx_cards_state ON cards(state);
      CREATE INDEX IF NOT EXISTS idx_sessions_subject ON sessions(subject);
      CREATE INDEX IF NOT EXISTS idx_topic_performance_subject_topic ON topic_performance(subject, topic);
      CREATE INDEX IF NOT EXISTS idx_recoveries_status ON recoveries(status);
    `);
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  private now(): string {
    return new Date().toISOString();
  }

  find<T>(table: string, filters: Record<string, unknown>): T | undefined {
    const keys = Object.keys(filters);
    const where = keys.map(k => `${k} = ?`).join(' AND ');
    const stmt = this.db.prepare(`SELECT * FROM ${table} WHERE ${where} LIMIT 1`);
    return stmt.get(...Object.values(filters)) as T | undefined;
  }

  findOne<T>(table: string, id: string): T | undefined {
    const stmt = this.db.prepare(`SELECT * FROM ${table} WHERE id = ? LIMIT 1`);
    return stmt.get(id) as T | undefined;
  }

  findAll<T>(table: string, filters?: Record<string, unknown>): T[] {
    if (!filters) {
      const stmt = this.db.prepare(`SELECT * FROM ${table}`);
      return stmt.all() as T[];
    }
    const keys = Object.keys(filters);
    const where = keys.map(k => `${k} = ?`).join(' AND ');
    const stmt = this.db.prepare(`SELECT * FROM ${table} WHERE ${where}`);
    return stmt.all(...Object.values(filters)) as T[];
  }

  create<T extends Record<string, unknown>>(table: string, data: T): T {
    const id = this.generateId();
    const now = this.now();
    const dataWithId = { ...data, id, created_at: now, updated_at: now };
    
    const keys = Object.keys(dataWithId).join(', ');
    const placeholders = Object.keys(dataWithId).map(() => '?').join(', ');
    const values = Object.values(dataWithId).map(v => 
      typeof v === 'object' ? JSON.stringify(v) : v
    );
    
    const stmt = this.db.prepare(`INSERT INTO ${table} (${keys}) VALUES (${placeholders})`);
    stmt.run(...values);
    
    return { ...dataWithId, id } as T;
  }

  update<T extends Record<string, unknown>>(table: string, id: string, data: Partial<T>): T | undefined {
    const now = this.now();
    const keys = Object.keys(data);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(data).map(v => 
      typeof v === 'object' ? JSON.stringify(v) : v
    ), now, id];
    
    const stmt = this.db.prepare(`UPDATE ${table} SET ${setClause}, updated_at = ? WHERE id = ?`);
    const result = stmt.run(...values);
    
    if (result.changes === 0) return undefined;
    return this.findOne<T>(table, id);
  }

  delete(table: string, id: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM ${table} WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  query<T>(sql: string, params: unknown[] = []): T[] {
    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as T[];
  }

  run(sql: string, params: unknown[] = []): void {
    const stmt = this.db.prepare(sql);
    stmt.run(...params);
  }

  close(): void {
    this.db.close();
  }
}

export const db = new DatabaseClient();