import { pool } from '@/lib/db';
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';

export type TrackResult = {
  id: string;
  name: string;
  artist: string;
  similarity: number;
};

export async function runVectorQuery(query: string): Promise<TrackResult[]> {
  const embedder = new OllamaEmbeddings({
    model: 'nomic-embed-text',
    baseUrl: 'http://localhost:11434',
  });

  const embedding = await embedder.embedQuery(query);
  const roundedEmbedding = embedding.map(x => Number(x.toFixed(6)));
  const vectorLiteral = `[${roundedEmbedding.join(',')}]`;

  const client = await pool.connect();

  try {
    const sql = `
        SELECT
            t.id::text,
                t.name,
            a.artist,
            1 - (e.embedding <#> '${vectorLiteral}'::vector) AS similarity
        FROM embeddings e
                 JOIN tracks t ON t.id::text = e.record_id
  JOIN albums a ON t.album_id = a.id
        WHERE e.type = 'track'
        ORDER BY e.embedding <#> '${vectorLiteral}'::vector
            LIMIT 10;
    `;
    console.log("vectorLiteral", vectorLiteral);
    console.log("length", embedding.length);
    console.log("is numeric", embedding.every(v => typeof v === 'number' && !isNaN(v)));
    const result = await client.query(sql);
    return result.rows as TrackResult[];
  } finally {
    client.release();
  }
}

