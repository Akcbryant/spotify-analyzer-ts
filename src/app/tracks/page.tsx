import {getTopTracks} from '@/lib/tracks';
import {TracksTable} from '@/components/TracksTable';
import {PaginationControls} from "@/components/PaginationControls";

export default async function TracksPage({ searchParams }: { searchParams: Record<string, string> }) {
  const awaitedSearchParams = await searchParams;
  const sort = awaitedSearchParams.sort ?? 'play_count';
  const dir = awaitedSearchParams.dir ?? 'desc';
  const page = parseInt(awaitedSearchParams.page ?? '1', 10);
  const limit = parseInt(awaitedSearchParams.limit ?? '50', 10);

  const tracks = await getTopTracks(sort, dir, page, limit);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Top Tracks</h1>
      <TracksTable data={tracks} sort={sort} dir={dir as 'asc' | 'desc'} />
      <PaginationControls page={page} sort={sort} dir={dir} />
    </div>
  );
}
