'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export function PaginationControls({
                                     page,
                                     sort,
                                     dir,
                                   }: {
  page: number;
  sort: string;
  dir: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goToPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams!.toString());
    params.set('page', nextPage.toString());
    params.set('sort', sort);
    params.set('dir', dir);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex gap-4 justify-center pt-2">
      <button
        disabled={page <= 1}
        onClick={() => goToPage(page - 1)}
        className="px-4 py-2 rounded bg-gray-200 disabled:opacity-50"
      >
        ◀ Previous
      </button>
      <span className="px-4 py-2 text-sm">Page {page}</span>
      <button
        onClick={() => goToPage(page + 1)}
        className="px-4 py-2 rounded bg-gray-200"
      >
        Next ▶
      </button>
    </div>
  );
}
