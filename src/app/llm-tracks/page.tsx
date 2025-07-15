'use client';

import { useState } from 'react';

type TrackResult = {
  id: string;
  name: string;
  artist: string;
  similarity: number;
  content: string;
  explanation?: string;
};

export default function LlmTracksPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TrackResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/llm-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      const data = await res.json();
      setResults(data.results);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Ask About Your Tracks</h1>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. mellow instrumental jazz"
          className="flex-1 px-4 py-2 border rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <p className="text-red-500">{error}</p>}

      <div className="space-y-4">
        {results.map((track) => (
          <div key={track.id} className="border p-4 rounded shadow-sm">
            <div className="font-semibold text-lg">{track.name}</div>
            <div className="text-gray-600">{track.artist}</div>
            <div className="text-sm text-gray-400 mb-1">Similarity: {track.similarity.toFixed(3)}</div>
            {track.explanation && (
              <div className="text-sm text-gray-700 italic mt-2">💬 {track.explanation}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
