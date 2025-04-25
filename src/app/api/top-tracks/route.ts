import { NextResponse } from 'next/server';
import pool from '@/lib/db'

export async function GET() {
  try {
    const res = await pool.query(`
      SELECT 
        t.name AS track_name,
        a.artist AS artist_name,
        a.name AS album_name,
        COUNT(lh.id) AS play_count,
        SUM(lh.ms_played) AS total_play_time
      FROM listening_history lh
      JOIN tracks t ON lh.track_id = t.id
      JOIN albums a ON t.album_id = a.id
      GROUP BY t.name, a.name, a.artist
      ORDER BY play_count DESC
      LIMIT 500
    `);

    return NextResponse.json(res.rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch top tracks' }, { status: 500 });
  }
}