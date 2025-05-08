'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';


type Track = {
  track_name: string;
  artist_name: string;
  album_name: string;
  play_count: number;
  total_play_time: number;
};

type Props = {
  data: Track[];
  sort: string;
  dir: 'asc' | 'desc';
};

export function TracksTable({ data, sort, dir }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();


  const toggleSort = (key: keyof Track) => {
    const currentSort = searchParams?.get('sort') ?? 'play_count';
    const currentDir = searchParams?.get('dir') ?? 'desc';

    const nextDir = currentSort === key && currentDir === 'desc' ? 'asc' : 'desc';

    const params = new URLSearchParams(searchParams!);
    params.set('sort', key);
    params.set('dir', nextDir);
    params.set('page', '1');

    router.push(`?${params.toString()}`);
  };

  const headers: { key: keyof Track; label: string; align?: 'right' }[] = [
    { key: 'track_name', label: 'Track' },
    { key: 'artist_name', label: 'Artist' },
    { key: 'album_name', label: 'Album' },
    { key: 'play_count', label: 'Plays', align: 'right' },
    { key: 'total_play_time', label: 'Time Played', align: 'right' },
  ];

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="min-w-full text-sm table-fixed border-collapse">
        <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
        <tr>
          {headers.map(({ key, label, align }) => (
            <th
              key={key}
              onClick={() => toggleSort(key)}
              className={`px-4 py-2 border-r last:border-r-0 font-medium whitespace-nowrap ${
                align === 'right' ? 'text-right' : 'text-left'
              } cursor-pointer select-none
              ${ sort === key ? 'bg-blue-50' : '' }`}
            >
              <div className="flex items-center justify-between">
                <span>{label}</span>
                {sort === key && (
                  <span className="ml-1 text-gray-500">{dir === 'asc' ? '▲' : '▼'}</span>
                )}
              </div>
            </th>
          ))}
        </tr>
        </thead>
        <tbody>
        {data.map((track, i) => (
          <tr key={i} className="even:bg-gray-50 border-b">
            <td className={`px-4 py-2 border-r ${sort === 'track_name' ? 'bg-blue-50' : ''}`}>
              {track.track_name}
            </td>
            <td className={`px-4 py-2 border-r ${sort === 'artist_name' ? 'bg-blue-50' : ''}`}>
              {track.artist_name}
            </td>
            <td className={`px-4 py-2 border-r ${sort === 'album_name' ? 'bg-blue-50' : ''}`}>
              {track.album_name}
            </td>
            <td className={`px-4 py-2 border-r text-right ${sort === 'play_count' ? 'bg-blue-50' : ''}`}>
              {track.play_count}
            </td>
            <td className={`px-4 py-2 text-right ${sort === 'total_play_time' ? 'bg-blue-50' : ''}`}>
              {formatMilliseconds(track.total_play_time)}
            </td>
          </tr>
        ))}
        </tbody>

      </table>
    </div>
  );
}

function formatMilliseconds(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
