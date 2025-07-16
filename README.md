# Spotify Analyzer with LLM-Powered Search

<p align="center">
  <img src="public/logo.png" width="200" alt="Spotify Analyzer Logo" />
</p>

This app lets you upload your Spotify listening history and explore it using semantic search powered by vector embeddings and a local Ollama model. Tracks are enriched with play behavior (skip/shuffle/incognito), and results include LLM explanations for why each track matched your query.

---

## 🔁 Ongoing Workflow

You can continue to listen to Spotify and upload new `.json` history files as often as you'd like. The app:

- Detects and skips duplicate listening records
- Re-embeds **only tracks with new listening data** since their last embedding
- Updates vector search to reflect your latest behavior

---

## 🧪 To Get Started

### 1. **Download your Spotify history**

Visit the [Spotify Privacy Center](https://www.spotify.com/us/account/privacy/) and request your extended streaming history. Once received:

- Unzip the archive
- Find the `.json` files (e.g., `Streaming_History_Audio_*.json`)

---

### 2. **Start your Postgres database**

Use Docker with `pgvector`:

```bash
docker run --name spotify-db \
  -e POSTGRES_USER=spotify \
  -e POSTGRES_PASSWORD=spotify \
  -e POSTGRES_DB=spotify \
  -p 5432:5432 \
  -d postgres:15
```

Then apply the schema:

```bash
psql -h localhost -U spotify -d spotify -f schema.sql
```

Ensure pgvector is enabled:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

### 3. **Upload your listening history**

Start the app:

```bash
npm run dev
```

Then visit:

```
http://localhost:3000/upload
```

Upload any number of `.json` files. The app:

- Deduplicates by `(track_id, timestamp, ms_played)`
- Imports new albums, tracks, and listening events

---

### 4. **Run Ollama locally**

Install and run Ollama:

```bash
brew install ollama
ollama run nomic-embed-text
ollama pull llama3
```

Ollama must be running at `http://localhost:11434` for embeddings and LLM explanations to work.

---

### 5. **Generate or update embeddings**

After each upload, run:

```bash
ts-node scripts/enrich-track-embeddings-incremental.js
```

This will:

- Check for tracks with new listening history
- Recompute their enriched metadata
- Generate new embeddings using `nomic-embed-text`
- Store vectors and explanations in the DB

---

### 6. **Query your tracks using natural language**

Visit:

```
http://localhost:3000/llm-tracks
```

Ask questions like:

- “What are the songs I never skip?”
- “Tracks I played the most in incognito mode”
- “Songs I always shuffle but rarely skip”

Each result shows:
- Similarity score
- LLM explanation for why the track matched your query

---

## ✨ Embedding Metadata

Each track's embedding now includes:

- Name, artist, album
- Play count
- Platforms used (e.g. iOS, desktop)
- Skip rate
- Shuffle rate
- Incognito mode rate

This enables far richer and more meaningful queries.

---

## 🧠 LLM-Powered Justification

The app also uses `llama3` (via Ollama) to generate a per-track explanation based on your query and the track’s metadata.

Example:

> **💬** “This track has a high play count and a 0% skip rate, suggesting it’s a consistent favorite.”

---

## 🔧 Environment Notes

- Set your `DATABASE_URL` like this:

  ```bash
  postgresql://spotify:spotify@localhost:5432/spotify
  ```

- Ensure the `embeddings` table has:

  ```sql
  embedding VECTOR(768),
  last_updated TIMESTAMP DEFAULT NOW()
  ```

- Use `schema.sql` to initialize your database.

---

## 🧭 TODO Ideas

- [x] Enrich embeddings with play count, behavior, platform
- [x] Re-embed only updated tracks after upload
- [x] Show LLM explanation per result
- [ ] Export results as a Spotify playlist
- [ ] Add album art and Spotify links
- [ ] Support genres, tagging, favorites, and query history

---

Happy exploring!
