'use client';

import { useState } from 'react';

export default function UploadPage() {
  const [message, setMessage] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setMessage('Upload successful!');
      } else {
        setMessage('Upload failed.');
      }
    } catch (err) {
      console.error(err);
      setMessage('An error occurred.');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Upload Spotify JSON</h1>
      <input type="file" accept=".json" onChange={handleUpload} className="mb-4" />
      {message && <p>{message}</p>}
    </div>
  );
}
