const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

let initializationPromise = null;

const initializeDatabase = () => {
    if (initializationPromise) {
        return initializationPromise;
    }
    initializationPromise = new Promise(async (resolve, reject) => {
        const client = await pool.connect();
        try {
            console.log('--- [DB] Initializing database schema ---');
            const initSQL = fs.readFileSync(path.join(__dirname, 'init.sql')).toString();
            const statements = initSQL.split(';').filter(statement => statement.trim() !== '');

            for (const statement of statements) {
                if (statement.trim()) {
                    await client.query(statement);
                }
            }
            console.log('--- [DB] Schema initialized successfully ---');

            const seed = require('./seed');
            await seed(client);

            console.log('--- [DB] Database is ready. ---');
            resolve();
        } catch (error) {
            console.error('--- [DB] FATAL: DATABASE INITIALIZATION FAILED ---', error);
            reject(error);
            process.exit(1);
        } finally {
            client.release();
        }
    });
    return initializationPromise;
};

module.exports = {
  query: async (text, params) => {
    await initializeDatabase();
    return pool.query(text, params);
  },
  getClient: async () => {
    await initializeDatabase();
    return pool.connect();
  },
  ensureInitialized: initializeDatabase,
};