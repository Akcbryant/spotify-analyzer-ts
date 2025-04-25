import { Pool } from 'pg';

const pool = new Pool({
  user: 'spotify',
  host: 'localhost',
  database: 'spotify',
  password: 'spotify',
  port: 5432,
});

export default pool;
