import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pg from 'pg';
const { Pool } = pg;
import { ingestJsonFile } from './ingest/ingest.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const app = express();
const PORT = 3001;

const pool = new Pool({
  user: 'spotify',
  database: 'spotify',
  password: 'spotify',
  host: 'localhost',
  port: 5432,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const upload = multer({ dest: path.join(__dirname, 'uploads') });

app.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  const filePath = req.file?.path;
  if (!filePath) return res.status(400).send('No file uploaded');

  try {
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(rawData);
    await ingestJsonFile(jsonData, pool);
    res.status(200).send('File ingested successfully!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to process the file.');
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
