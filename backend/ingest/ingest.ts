import { Pool } from 'pg';

export interface SpotifyEntry {
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
}

const insertIfNotExists = async (
  client: any,
  table: string,
  columns: string[],
  values: any[],
  conflictCols: string[]
): Promise<number | null> => {
  const colsStr = columns.join(", ");
  const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
  const conflictStr = conflictCols.join(", ");
  const query = `
    INSERT INTO ${table} (${colsStr})
    VALUES (${placeholders})
    ON CONFLICT (${conflictStr}) DO NOTHING
    RETURNING id
  `;
  const result = await client.query(query, values);
  return result.rows[0]?.id ?? null;
};

export async function ingestJsonFile(data: SpotifyEntry[], pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const item of data) {
      const {
        master_metadata_album_album_name: albumName,
        master_metadata_album_artist_name: artistName,
        master_metadata_track_name: trackName,
        spotify_track_uri: spotifyUri
      } = item;

      if (!trackName || !albumName || !artistName || !spotifyUri) continue;

      const albumId = await insertIfNotExists(
        client,
        'albums',
        ['name', 'artist'],
        [albumName, artistName],
        ['name', 'artist']
      );

      const trackId = await insertIfNotExists(
        client,
        'tracks',
        ['name', 'spotify_track_uri', 'album_id'],
        [trackName, spotifyUri, albumId],
        ['spotify_track_uri']
      );

      await client.query(
        `INSERT INTO listening_history
          (track_id, timestamp, ms_played, platform, conn_country, ip_addr, shuffle, skipped, offline, incognito_mode, reason_start, reason_end)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
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
          item.reason_end
        ]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
