import Database from "better-sqlite3";
import path from "path";
import os from "os";

const DB_PATH = path.join(os.homedir(), ".claude", "engram.db");

const globalKey = "__engramDb";

function getDb(): Database.Database {
  const g = globalThis as unknown as Record<string, Database.Database>;
  if (!g[globalKey]) {
    const db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
    g[globalKey] = db;
  }
  return g[globalKey];
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS traces (
      trace_id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      agent_name TEXT,
      runtime TEXT NOT NULL,
      prompt_preview TEXT,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      status TEXT NOT NULL DEFAULT 'running',
      total_tokens INTEGER,
      input_tokens INTEGER,
      output_tokens INTEGER,
      total_cost REAL,
      error TEXT,
      metadata TEXT
    );

    CREATE TABLE IF NOT EXISTS spans (
      span_id TEXT PRIMARY KEY,
      trace_id TEXT NOT NULL REFERENCES traces(trace_id),
      parent_span_id TEXT,
      name TEXT NOT NULL,
      span_type TEXT,
      started_at TEXT NOT NULL,
      duration_ms INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'running',
      error TEXT,
      metadata TEXT
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      level TEXT NOT NULL,
      source TEXT NOT NULL,
      source_id TEXT,
      message TEXT NOT NULL,
      metadata TEXT
    );

    CREATE TABLE IF NOT EXISTS cost_daily (
      date TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      runtime TEXT NOT NULL,
      total_tokens INTEGER NOT NULL DEFAULT 0,
      input_tokens INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      total_cost REAL NOT NULL DEFAULT 0,
      trace_count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (date, agent_id, runtime)
    );

    CREATE INDEX IF NOT EXISTS idx_traces_agent ON traces(agent_id);
    CREATE INDEX IF NOT EXISTS idx_traces_status ON traces(status);
    CREATE INDEX IF NOT EXISTS idx_spans_trace ON spans(trace_id);
    CREATE INDEX IF NOT EXISTS idx_logs_source ON logs(source, source_id);
    CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
  `);
}

export default getDb;
