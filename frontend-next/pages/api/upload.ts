import { IncomingForm } from 'formidable';
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import { Pool } from 'pg';

// Disable Next.js default body parser to handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

// Setup your Postgres pool
const pool = new Pool({
  user: 'spotify',
  host: 'localhost',
  database: 'spotify',
  password: 'spotify',
  port: 5432,
});

// Define the expected shape of your Spotify history JSON
type SpotifyEntry = {
  ts: string;
  platform: string;
  ms_played: number;
  conn_country: string;
  ip_addr: string;
  master_metadata_track_name: string;
  master_metadata_album_artist_name: string;
  master_metadata_album_album_name: string;
  spotify_track_uri: string;
  reason_start: string;
  reason_end: string;
  shuffle: boolean;
  skipped: boolean;
  offline: boolean;
  incognito_mode: boolean;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('endpoint pages/api/upload.ts handler')
  if (req.method !== 'POST') return res.status(405).end();

  const form = new IncomingForm({ multiples: false });

  const data = await new Promise<{ fields: any; files: any }>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });

  const file = (Array.isArray(data.files.file) ? data.files.file[0] : data.files.file);
  const content = fs.readFileSync(file.filepath, 'utf-8');
  const jsonData = JSON.parse(content) as SpotifyEntry[];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const item of jsonData) {
      const {
        master_metadata_album_album_name: albumName,
        master_metadata_album_artist_name: artistName,
        master_metadata_track_name: trackName,
        spotify_track_uri: uri,
      } = item;

      if (!trackName || !albumName || !artistName || !uri) continue;

      const album = await client.query(
        `INSERT INTO albums (name, artist)
         VALUES ($1, $2)
         ON CONFLICT (name, artist) DO NOTHING
         RETURNING id`,
        [albumName, artistName]
      );

      const albumId = album.rows[0]?.id ?? (
        await client.query(`SELECT id FROM albums WHERE name = $1 AND artist = $2`, [albumName, artistName])
      ).rows[0].id;

      const track = await client.query(
        `INSERT INTO tracks (name, spotify_track_uri, album_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (spotify_track_uri) DO NOTHING
         RETURNING id`,
        [trackName, uri, albumId]
      );

      const trackId = track.rows[0]?.id ?? (
        await client.query(`SELECT id FROM tracks WHERE spotify_track_uri = $1`, [uri])
      ).rows[0].id;

      await client.query(
        `INSERT INTO listening_history
          (track_id, timestamp, ms_played, platform, conn_country, ip_addr, shuffle, skipped, offline, incognito_mode, reason_start, reason_end)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (track_id, timestamp, ms_played) DO NOTHING`,
        [
          trackId,
          item.ts,
          item.ms_played,
          item.platform,
          item.conn_country,
          item.ip_addr,
          item.shuffle,
          item.skipped,
          item.offline,
          item.incognito_mode,
          item.reason_start,
          item.reason_end,
        ]
      );
    }

    await client.query('COMMIT');
    res.status(200).json({ message: 'Upload successful' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  } finally {
    client.release();
  }
}
