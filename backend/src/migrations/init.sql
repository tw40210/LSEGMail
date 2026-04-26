CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  frequency VARCHAR(10) NOT NULL CHECK (frequency IN ('daily', 'weekly')),
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rotation_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rotation_id UUID NOT NULL REFERENCES rotations(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  UNIQUE (rotation_id, member_id),
  UNIQUE (rotation_id, position)
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rotation_id UUID NOT NULL REFERENCES rotations(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  event_date DATE NOT NULL,
  title VARCHAR(255),
  notes TEXT,
  email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  manually_edited BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (rotation_id, event_date)
);

CREATE TABLE IF NOT EXISTS gmail_config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  authorized_email VARCHAR(255),
  email_subject_template VARCHAR(500) DEFAULT 'You are hosting the event on {date}',
  email_body_template TEXT DEFAULT 'Hi {name},\n\nThis is a reminder that you are assigned to host the event on {date}.\n\nBest regards,\nRotation System',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO gmail_config (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER rotations_updated_at BEFORE UPDATE ON rotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER calendar_events_updated_at BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER gmail_config_updated_at BEFORE UPDATE ON gmail_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
