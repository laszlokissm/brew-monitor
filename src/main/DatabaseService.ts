import Database, { Database as DatabaseType } from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'

export class DatabaseService {
  private db: DatabaseType

  constructor(customPath?: string) {
    // If no custom path is provided, save to Electron's user data directory
    const dbPath = customPath || path.join(app.getPath('userData'), 'brew-monitor.db')
    this.db = new Database(dbPath)

    this.initPragmas()
    this.initSchema()
  }

  /**
   * Configure SQLite pragmas for performance and data integrity
   */
  private initPragmas(): void {
    // WAL mode (Write-Ahead Logging) improves concurrent read/write performance
    this.db.pragma('journal_mode = WAL')
    // Enable foreign key constraints (disabled by default in SQLite)
    this.db.pragma('foreign_keys = ON')
  }

  /**
   * Create database tables and indexes if they do not exist
   */
  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS recipe_steps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id INTEGER NOT NULL,
        step_order INTEGER NOT NULL,
        name TEXT NOT NULL,
        target_temperature REAL NOT NULL,
        duration_minutes INTEGER NOT NULL,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        recipe_id INTEGER,
        vessel_id TEXT NOT NULL,
        status TEXT NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        notes TEXT,
        recipe_snapshot TEXT,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS telemetry_readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        temperature REAL NOT NULL,
        target_temperature REAL,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_telemetry_session_time 
      ON telemetry_readings(session_id, timestamp);

      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_notifications_session 
      ON notifications(session_id, timestamp);
    `)
  }

  /**
   * Provides access to the underlying SQLite database instance for other services
   */
  public getDb(): DatabaseType {
    return this.db
  }

  /**
   * Safely closes the database connection on app shutdown
   */
  public close(): void {
    if (this.db.open) {
      this.db.close()
    }
  }
}
