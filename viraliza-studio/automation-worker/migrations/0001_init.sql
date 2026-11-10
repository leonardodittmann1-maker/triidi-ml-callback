CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  paused INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT OR IGNORE INTO settings(id, paused) VALUES (1, 1);
CREATE TABLE IF NOT EXISTS destinations (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL CHECK(platform IN ('telegram','pinterest','instagram','facebook')),
  label TEXT NOT NULL,
  external_id TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  owner_confirmed INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  UNIQUE(platform,external_id)
);
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  destination_id TEXT NOT NULL REFERENCES destinations(id),
  product_id TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  scheduled_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('review','approved','sending','sent','needs_review','cancelled')) DEFAULT 'review',
  approved_at TEXT,
  sent_at TEXT,
  remote_id TEXT,
  remote_url TEXT,
  last_error TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  fingerprint TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS jobs_due ON jobs(status,scheduled_at);
CREATE INDEX IF NOT EXISTS jobs_target ON jobs(destination_id, sent_at);
CREATE TABLE IF NOT EXISTS audit (
  id TEXT PRIMARY KEY,
  job_id TEXT,
  action TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
