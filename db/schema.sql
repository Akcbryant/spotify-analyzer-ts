CREATE TABLE albums (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    artist TEXT NOT NULL,
    UNIQUE(name, artist)
);

CREATE TABLE tracks (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    spotify_track_uri TEXT UNIQUE NOT NULL,
    album_id INTEGER REFERENCES albums(id)
);

CREATE TABLE listening_history (
    id SERIAL PRIMARY KEY,
    track_id INTEGER REFERENCES tracks(id),
    timestamp TIMESTAMP NOT NULL,
    ms_played INTEGER,
    platform TEXT,
    conn_country TEXT,
    ip_addr TEXT,
    shuffle BOOLEAN,
    skipped BOOLEAN,
    offline BOOLEAN,
    incognito_mode BOOLEAN,
    reason_start TEXT,
    reason_end TEXT,
    UNIQUE(track_id, timestamp, ms_played)
);

CREATE TABLE IF NOT EXISTS embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- 'track', 'album', or 'history'
    record_id TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(768),
    created_at TIMESTAMP DEFAULT NOW()
    COLUMN last_updated TIMESTAMP DEFAULT NOW();
);
-- Optional: index for faster search by record
CREATE INDEX IF NOT EXISTS idx_embeddings_type_record ON embeddings(type, record_id);
-- 🔒 Required for ON CONFLICT (type, record_id)
CREATE UNIQUE INDEX IF NOT EXISTS embeddings_type_record_id_unique
    ON embeddings(type, record_id);
