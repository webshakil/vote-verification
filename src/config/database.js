import pkg from 'pg';
import dotenv from 'dotenv'
const { Pool } = pkg;
dotenv.config()

const pool = new Pool({
  user: process.env.DB_USER || 'vottery_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'vottery',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  ssl: {
    rejectUnauthorized: false, // allow self-signed certs (needed for many managed DBs)
  }
});

pool.on('connect', () => {
  console.log('Database connected successfully at:', new Date().toISOString());
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

export const query = async (text, params) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export default pool;
