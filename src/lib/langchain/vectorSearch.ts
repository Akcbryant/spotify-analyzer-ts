import { pool } from '@/lib/db';
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';
import { getOllamaExplanation } from './getOllamaExplanation';

export type TrackResult = {
  id: string;
  name: string;
  artist: string;
  similarity: number;
  content: string;
  explanation?: string;
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
            e.content,
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

    const withExplanations: TrackResult[] = await Promise.all(
      result.rows.map(async (row) => ({
        id: row.id,
        name: row.name,
        artist: row.artist,
        similarity: row.similarity,
        content: row.content,
        explanation: await getOllamaExplanation(query, row.content),
      }))
    );
    return withExplanations;
  } finally {
    client.release();
  }
}

