import pg from "pg";
import fs from "fs";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import "dotenv/config";

const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://spotify:spotify@localhost:5432/spotify' });

const embedder = new OllamaEmbeddings({
    model: "nomic-embed-text",
    baseUrl: "http://localhost:11434",
});

const PROGRESS_FILE = "./embedded_track_ids.json";

function loadProgress() {
    try {
        const raw = fs.readFileSync(PROGRESS_FILE, "utf-8");
        const data = JSON.parse(raw);
        return new Set(data);
    } catch {
        return new Set();
    }
}

function saveProgress(progress) {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify([...progress], null, 2));
}

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
    const completed = loadProgress();

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
        GROUP BY t.id, t.name, a.name, a.artist
    `);

    console.log(`Found ${tracks.length} tracks.`);
    let processed = 0;

    for (const row of tracks) {
        const trackId = row.track_id.toString();

        if (completed.has(trackId)) {
            continue;
        }

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
                `INSERT INTO embeddings (type, record_id, content, embedding)
                 VALUES ('track', $1, $2, $3)
                     ON CONFLICT (type, record_id)
         DO UPDATE SET content = EXCLUDED.content, embedding = EXCLUDED.embedding`,
                [trackId, content, pgVector]
            );

            completed.add(trackId);
            processed++;

            if (processed % 10 === 0) {
                saveProgress(completed);
                console.log(`📝 Saved progress at ${processed} tracks`);
            }

            console.log(`✅ Embedded: ${row.track_name}`);
        } catch (err) {
            console.error(`❌ Failed to embed: ${row.track_name}`, err);
        }
    }

    saveProgress(completed);
    await pool.end();
    console.log("🎉 Done");
}

main().catch(console.error);
