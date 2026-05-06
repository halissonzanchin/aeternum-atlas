CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'institution')),
  user_type TEXT NOT NULL,
  institution TEXT,
  country TEXT,
  language TEXT NOT NULL DEFAULT 'pt' CHECK (language IN ('pt', 'es', 'en')),
  subscription_status TEXT NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled')),
  subscription_plan TEXT,
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE models (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  region TEXT,
  system TEXT,
  level TEXT NOT NULL,
  cover_image_url TEXT,
  sketchfab_url TEXT,
  sketchfab_embed_url TEXT,
  sketchfab_model_url TEXT,
  short_url TEXT,
  author TEXT,
  provider TEXT,
  viewer_type TEXT NOT NULL DEFAULT 'sketchfab' CHECK (viewer_type IN ('sketchfab', 'threejs')),
  content_type TEXT NOT NULL DEFAULT 'Modelo didático',
  is_premium BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  clinical_notes TEXT,
  learning_objectives TEXT,
  related_structures TEXT,
  references_text TEXT,
  access_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE anatomical_structures (
  id TEXT PRIMARY KEY,
  model_id TEXT NOT NULL REFERENCES models(id),
  name TEXT NOT NULL,
  latin_name TEXT,
  system TEXT,
  region TEXT,
  description TEXT,
  location TEXT,
  type TEXT,
  clinical_notes TEXT,
  parent_structure_id TEXT REFERENCES anatomical_structures(id)
);

CREATE TABLE model_parts (
  id TEXT PRIMARY KEY,
  structure_id TEXT NOT NULL REFERENCES anatomical_structures(id),
  name TEXT NOT NULL,
  latin_name TEXT,
  thumbnail_url TEXT,
  description TEXT
);

CREATE TABLE user_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  model_id TEXT NOT NULL REFERENCES models(id),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  favorite BOOLEAN NOT NULL DEFAULT FALSE,
  last_accessed_at TIMESTAMP,
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100)
);

CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  plan TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('trial', 'active', 'expired', 'cancelled')),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  provider TEXT
);

CREATE TABLE groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE group_members (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member'))
);
