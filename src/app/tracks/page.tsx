import {getTopTracks, Track} from '@/lib/tracks';
import { TracksTable } from '@/components/TracksTable';

export default async function TracksPage() {
  const tracks = await getTopTracks();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Top Tracks</h1>
      <TracksTable data={tracks} />
    </div>
  );
}
