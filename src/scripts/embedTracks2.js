import pg from "pg";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import "dotenv/config";

const { Pool } = pg;
const pool = new Pool({
    connectionString: 'postgresql://spotify:spotify@localhost:5432/spotify',
});

const embedder = new OllamaEmbeddings({
    model: "nomic-embed-text",
    baseUrl: "http://localhost:11434",
});

async function retryWithBackoff(fn, retries = 5, delay = 1000) {
    let attempt = 0;
    while (attempt < retries) {
        try {
            return await fn();
        } catch (err) {
            if (attempt === retries - 1) throw err;
            const wait = delay * Math.pow(2, attempt);
            console.warn(`Retrying in ${wait / 1000}s...`);
            await new Promise(res => setTimeout(res, wait));
            attempt++;
        }
    }
    throw new Error("Max retries reached");
}

async function main() {
    const { rows: tracks } = await pool.query(`
    SELECT
      t.id AS track_id,
      t.name AS track_name,
      a.name AS album_name,
      a.artist AS album_artist,
      COUNT(lh.*) AS play_count,
      ROUND(AVG(CASE WHEN lh.shuffle THEN 1 ELSE 0 END)::numeric, 2) AS shuffle_rate,
      ROUND(AVG(CASE WHEN lh.skipped THEN 1 ELSE 0 END)::numeric, 2) AS skip_rate,
      ROUND(AVG(CASE WHEN lh.incognito_mode THEN 1 ELSE 0 END)::numeric, 2) AS incognito_rate,
      ARRAY_AGG(DISTINCT lh.platform) AS platforms
    FROM tracks t
    JOIN albums a ON t.album_id = a.id
    LEFT JOIN listening_history lh ON lh.track_id = t.id
    LEFT JOIN embeddings e ON e.record_id = t.id::text AND e.type = 'track'
    GROUP BY t.id, t.name, a.name, a.artist, e.last_updated
    HAVING MAX(lh.timestamp) > COALESCE(MAX(e.last_updated), '1970-01-01')
  `);

    console.log(`Found ${tracks.length} tracks to embed/re-embed.`);

    for (const row of tracks) {
        const trackId = row.track_id.toString();

        const content = `
Track: ${row.track_name}
Artist: ${row.album_artist}
Album: ${row.album_name}
Play Count: ${row.play_count}
Platforms: ${row.platforms.join(', ')}
Shuffle Rate: ${row.shuffle_rate}
Skip Rate: ${row.skip_rate}
Incognito Mode Rate: ${row.incognito_rate}
`.trim();

        console.log(`⏳ Embedding track: ${row.track_name} (${trackId})`);

        try {
            const vector = await retryWithBackoff(() => embedder.embedQuery(content));
            const pgVector = '[' + vector.join(',') + ']';

            await pool.query(
                `INSERT INTO embeddings (type, record_id, content, embedding, last_updated)
         VALUES ('track', $1, $2, $3, NOW())
         ON CONFLICT (type, record_id)
         DO UPDATE SET content = EXCLUDED.content, embedding = EXCLUDED.embedding, last_updated = NOW()`,
                [trackId, content, pgVector]
            );

            console.log(`✅ Embedded: ${row.track_name}`);
        } catch (err) {
            console.error(`❌ Failed to embed: ${row.track_name}`, err);
        }
    }

    await pool.end();
    console.log("🎉 Done");
}

main().catch(console.error);
