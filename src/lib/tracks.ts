export type Track = {
  track_name: string;
  artist_name: string;
  album_name: string;
  play_count: number;
  total_play_time: number;
};

export async function getTopTracks(
  sort: string = 'play_count',
  dir: string = 'desc',
  page = 1,
  limit = 50
) {
  const res = await fetch(`http://localhost:3000/api/top-tracks?sort=${sort}&dir=${dir}&page=${page}&limit=${limit}`, {cache: 'no-store'});
  return res.json();
}

