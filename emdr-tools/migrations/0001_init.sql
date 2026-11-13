-- Therapists (free tier) — future Practice OS hierarchy ready
CREATE TABLE IF NOT EXISTS therapists (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  country TEXT,
  profession TEXT,
  emdr_training_status TEXT,
  account_tier TEXT NOT NULL DEFAULT 'therapist-free',
  privacy_consent INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  token TEXT PRIMARY KEY,
  therapist_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (therapist_id) REFERENCES therapists(id) ON DELETE CASCADE
);

-- Saved sessions: anonymous reference only by default (no identifiable client fields required)
CREATE TABLE IF NOT EXISTS clinical_sessions (
  id TEXT PRIMARY KEY,
  therapist_id TEXT NOT NULL,
  reference_label TEXT NOT NULL,
  phase TEXT,
  target_json TEXT,
  sets_json TEXT,
  total_processing_ms INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (therapist_id) REFERENCES therapists(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_therapist ON clinical_sessions(therapist_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_therapist ON auth_sessions(therapist_id);
