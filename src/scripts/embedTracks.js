import pg from "pg";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import "dotenv/config";

const { Pool } = pg;

const pool = new Pool({ connectionString: 'postgresql://spotify:spotify@localhost:5432/spotify' });

const embedder = new OllamaEmbeddings({
  model: "nomic-embed-text",
  baseUrl: "http://localhost:11434",
});

async function main() {
  const { rows: tracks } = await pool.query(`
    SELECT id, name FROM tracks
    WHERE id::text NOT IN (
      SELECT record_id FROM embeddings WHERE type = 'track'
    )
  `);

  console.log(`Found ${tracks.length} tracks to embed.`);

  for (const track of tracks) {
    try {
      const vector = await embedder.embedQuery(track.name);
      const pgVector = `[${vector.join(",")}]`;

      await pool.query(
          `INSERT INTO embeddings (type, record_id, content, embedding)
         VALUES ('track', $1, $2, $3)`,
          [track.id.toString(), track.name, pgVector]
      );

      console.log(`✅ Embedded: ${track.name}`);
    } catch (err) {
      console.error(`❌ Failed to embed track: ${track.name}`, err);
    }
  }

  await pool.end();
}

main().catch(console.error);


