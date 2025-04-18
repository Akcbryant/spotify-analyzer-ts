import React, { useState } from 'react';

export default function UploadPage() {
  const [message, setMessage] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/upload', {
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
    <div style={{ padding: '2rem' }}>
      <h2>Upload Spotify JSON</h2>
      <input type="file" accept=".json" onChange={handleUpload} />
      {message && <p>{message}</p>}
    </div>
  );
}
