export type Track = {
  track_name: string;
  artist_name: string;
  album_name: string;
  play_count: number;
  total_play_time: number;
};

export async function getTopTracks(): Promise<Track[]> {
  const res = await fetch('http://localhost:3000/api/top-tracks', {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch top tracks');
  }

  return res.json();
}
