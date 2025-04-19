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
