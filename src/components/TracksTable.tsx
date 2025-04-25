'use client';

import { useState } from 'react';

type Track = {
  track_name: string;
  artist_name: string;
  album_name: string;
  play_count: number;
  total_play_time: number;
};

type Props = {
  data: Track[];
};

export function TracksTable({ data }: Props) {
  const [sortKey, setSortKey] = useState<keyof Track>('play_count');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (key: keyof Track) => {
    if (key === sortKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...data].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return sortDir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

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
              } cursor-pointer select-none`}
            >
              <div className="flex items-center justify-between">
                <span>{label}</span>
                {sortKey === key && (
                  <span className="ml-1 text-gray-500">{sortDir === 'asc' ? '▲' : '▼'}</span>
                )}
              </div>
            </th>
          ))}
        </tr>
        </thead>
        <tbody>
        {sorted.map((track, i) => (
          <tr key={i} className="even:bg-gray-50 border-b">
            <td className="px-4 py-2 border-r">{track.track_name}</td>
            <td className="px-4 py-2 border-r">{track.artist_name}</td>
            <td className="px-4 py-2 border-r">{track.album_name}</td>
            <td className="px-4 py-2 border-r text-right">{track.play_count}</td>
            <td className="px-4 py-2 text-right">
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
