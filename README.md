# Spotify Analyzer with LLM-Powered Search

This app lets you upload your Spotify listening history and explore it using semantic search powered by vector embeddings and a local Ollama model.

---

To get started:

1. **Download your Spotify history**  
   Visit the [Spotify Privacy Center](https://www.spotify.com/us/account/privacy/) and request your extended streaming history. It may take a few days for Spotify to send it. Once received, unzip the file and find the `.json` files (e.g., `Streaming_History_Audio_*.json`).

2. **Start your Postgres database**  
   You’ll need PostgreSQL with `pgvector` enabled. Start it via Docker like so:

   ```bash
   docker run --name spotify-db      -e POSTGRES_USER=spotify      -e POSTGRES_PASSWORD=spotify      -e POSTGRES_DB=spotify      -p 5432:5432      -d postgres:15
   ```

   Then connect to it and run the schema:

   ```bash
   psql -h localhost -U spotify -d spotify -f schema.sql
   ```

   If `pgvector` isn’t already enabled, run this in `psql`:

   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

3. **Upload your listening history**  
   Start the app with:

   ```bash
   npm run dev
   ```

   Then visit:

   ```
   http://localhost:3000/upload
   ```

   Upload your Spotify history `.json` files here to import the data.

4. **Run Ollama locally**  
   Install and run the `nomic-embed-text` model using [Ollama](https://ollama.com):

   ```bash
   brew install ollama
   ollama run nomic-embed-text
   ```

   This will start a local server at `http://localhost:11434` used for generating text embeddings.

5. **Generate embeddings**  
   After uploading your data, generate embeddings for your tracks by running:

   ```bash
   ts-node scripts/embedTracks.ts
   ```

   This creates 768-dimension vectors for your tracks and stores them in the `embeddings` table in your database.

6. **Query your tracks using natural language**  
   Navigate to:

   ```
   http://localhost:3000/llm-tracks
   ```

   Try typing things like:

   - “Songs I played the most”
   - “Tracks that sound chill”
   - “Music with emotional tone”

   Keep in mind: the embedding is currently based on track name and artist only. To improve results, you can add more context (see TODO below).

---

## TODO Ideas

- Add genre, play count, and album name to embedding content
- Show album art and Spotify links
- Use streaming responses from the LLM
- Filter by play date, platform, or skip count
- Support favoriting or tagging tracks
- Store chat history or past queries

---

## Notes

- `DATABASE_URL` should be set in your environment, e.g.:

  ```
  postgresql://spotify:spotify@localhost:5432/spotify
  ```

- You must have the `pgvector` extension and the `embedding` column in the `embeddings` table set to `vector(768)`.

- Embedding data is currently only generated for tracks, but can be extended to albums, artists, or full listening history.

---

Happy exploring!
