import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

const VALID_SORT_KEYS = ['track_name', 'artist_name', 'album_name', 'play_count', 'total_play_time'];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get('sort') || 'play_count';
  const dir = searchParams.get('dir') === 'asc' ? 'ASC' : 'DESC';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  const safeSort = VALID_SORT_KEYS.includes(sort) ? sort : 'play_count';
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `
          SELECT *
          FROM (SELECT t.name            AS track_name,
                       a.name            AS album_name,
                       a.artist          AS artist_name,
                       COUNT(lh.id)      AS play_count,
                       SUM(lh.ms_played) AS total_play_time
                FROM listening_history lh
                         JOIN tracks t ON lh.track_id = t.id
                         JOIN albums a ON t.album_id = a.id
                GROUP BY t.name, a.name, a.artist) AS grouped
          ORDER BY ${safeSort} ${dir}
          LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }
}
