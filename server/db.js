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

// Singleton promise to ensure initialization only runs once.
let initializationPromise = null;

/**
 * Initializes the database by creating the schema and seeding it with data.
 * This function is designed to be idempotent (it only runs the initialization once).
 * @returns {Promise<void>} A promise that resolves when the database is ready.
 */
const initializeDatabase = () => {
    if (initializationPromise) {
        return initializationPromise;
    }

    initializationPromise = new Promise(async (resolve, reject) => {
        const client = await pool.connect();
        try {
            console.log('--- [DB] Starting database initialization...');
            const initSQL = fs.readFileSync(path.join(__dirname, 'init.sql')).toString();
            const statements = initSQL.split(';').filter(statement => statement.trim() !== '');

            for (const statement of statements) {
                if (statement.trim()) {
                    await client.query(statement);
                }
            }
            console.log('--- [DB] Schema created successfully.');

            const seed = require('./seed');
            await seed(client);

            console.log('--- [DB] Database is fully initialized and ready.');
            resolve();
        } catch (error) {
            console.error('--- [DB] FATAL: DATABASE INITIALIZATION FAILED ---', error);
            reject(error);
            process.exit(1); // Exit if DB initialization fails.
        } finally {
            client.release();
        }
    });

    return initializationPromise;
};

module.exports = {
  /**
   * Executes a query after ensuring the database is initialized.
   * @param {string} text - The SQL query text.
   * @param {Array} params - The query parameters.
   * @returns {Promise<QueryResult>} The result of the query.
   */
  query: async (text, params) => {
    await initializeDatabase();
    return pool.query(text, params);
  },

  /**
   * Gets a client from the pool after ensuring the database is initialized.
   * @returns {Promise<PoolClient>} A database client.
   */
  getClient: async () => {
    await initializeDatabase();
    return pool.connect();
  },

  /**
   * A dedicated function to be called at server startup to ensure the DB is ready.
   * @returns {Promise<void>}
   */
  ensureInitialized: initializeDatabase,
};