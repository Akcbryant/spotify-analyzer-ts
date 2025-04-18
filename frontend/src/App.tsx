import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import TracksPage from './pages/TracksPage';
import AlbumsPage from './pages/AlbumsPage';

export default function App() {
  return (
    <Router>
      <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <Link to="/" style={{ marginRight: '1rem' }}>Upload</Link>
        <Link to="/tracks" style={{ marginRight: '1rem' }}>Tracks</Link>
        <Link to="/albums">Albums</Link>
      </nav>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/tracks" element={<TracksPage />} />
        <Route path="/albums" element={<AlbumsPage />} />
      </Routes>
    </Router>
  );
}
