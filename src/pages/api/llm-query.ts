import { NextApiRequest, NextApiResponse } from 'next';
import { runVectorQuery } from '@/lib/langchain/vectorSearch'; // adjust path

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { query } = req.body;

  try {
    const results = await runVectorQuery(query); // implement this
    res.status(200).json({ results });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Query failed' });
  }
}
