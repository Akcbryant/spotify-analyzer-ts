import { IncomingForm } from 'formidable';
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import pool from '@/lib/db';

// Disable default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

type NormalizedEntry = {
  timestamp: string;
  trackName: string;
  artistName: string;
  albumName: string;
  spotifyUri: string;
  msPlayed: number;
  platform: string | null;
  connCountry: string | null;
  ipAddr: string | null;
  shuffle: boolean;
  skipped: boolean;
  offline: boolean;
  incognitoMode: boolean;
  reasonStart: string | null;
  reasonEnd: string | null;
};

function normalizeEntry(entry: any): NormalizedEntry | null {
  if ("endTime" in entry && "trackName" in entry && "artistName" in entry) {
    // New format
    const trackName = entry.trackName || "(unknown track)";
    const artistName = entry.artistName || "(unknown artist)";
    return {
      timestamp: new Date(entry.endTime).toISOString(),
      trackName: trackName,
      artistName: artistName,
      albumName: "(unknown album)",
      spotifyUri: `local://${encodeURIComponent(artistName)}::${encodeURIComponent(trackName)}`,
      msPlayed: entry.msPlayed,
      platform: null,
      connCountry: null,
      ipAddr: null,
      shuffle: false,
      skipped: false,
      offline: false,
      incognitoMode: false,
      reasonStart: null,
      reasonEnd: null,
    };
  }

  if (
    "ts" in entry &&
    "master_metadata_track_name" in entry &&
    "master_metadata_album_artist_name" in entry
  ) {
    // Old extended format
    return {
      timestamp: new Date(entry.ts).toISOString(),
      trackName: entry.master_metadata_track_name ?? "(unknown track)",
      artistName: entry.master_metadata_album_artist_name ?? "(unknown artist)",
      albumName: entry.master_metadata_album_album_name ?? "(unknown album)",
      spotifyUri: entry.spotify_track_uri ?? "(unknown uri)",
      msPlayed: entry.ms_played,
      platform: entry.platform ?? null,
      connCountry: entry.conn_country ?? null,
      ipAddr: entry.ip_addr ?? null,
      shuffle: entry.shuffle ?? false,
      skipped: entry.skipped ?? false,
      offline: entry.offline ?? false,
      incognitoMode: entry.incognito_mode ?? false,
      reasonStart: entry.reason_start ?? null,
      reasonEnd: entry.reason_end ?? null,
    };
  }

  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
  const rawEntries = JSON.parse(content);
  const entries = rawEntries.map(normalizeEntry).filter((e): e is NormalizedEntry => !!e);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const item of entries) {
      const {
        albumName,
        artistName,
        trackName,
        spotifyUri,
        timestamp,
        msPlayed,
        platform,
        connCountry,
        ipAddr,
        shuffle,
        skipped,
        offline,
        incognitoMode,
        reasonStart,
        reasonEnd,
      } = item;

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
        [trackName, spotifyUri, albumId]
      );

      const trackId = track.rows[0]?.id ?? (
        await client.query(`SELECT id FROM tracks WHERE spotify_track_uri = $1`, [spotifyUri])
      ).rows[0].id;

      await client.query(
        `INSERT INTO listening_history
         (track_id, timestamp, ms_played, platform, conn_country, ip_addr, shuffle, skipped, offline, incognito_mode, reason_start, reason_end)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             ON CONFLICT (track_id, timestamp, ms_played) DO NOTHING`,
        [
          trackId,
          timestamp,
          msPlayed,
          platform,
          connCountry,
          ipAddr,
          shuffle,
          skipped,
          offline,
          incognitoMode,
          reasonStart,
          reasonEnd,
        ]
      );
    }

    await client.query('COMMIT');
    res.status(200).json({ message: `Uploaded ${entries.length} entries successfully` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  } finally {
    client.release();
  }
}
