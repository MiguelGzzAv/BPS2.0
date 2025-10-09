const db = require('../db');

const getDatabaseStatus = async (req, res) => {
  try {
    // A lightweight way to check if the pool can connect to the DB.
    const client = await db.getClient();
    // If we get a client, the connection is successful. Release it immediately.
    client.release();

    // Return the connection status and non-sensitive config details.
    // IMPORTANT: Never expose the password.
    res.json({
      connected: true,
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      port: process.env.DB_PORT,
    });
  } catch (error) {
    console.error('Database connection check failed:', error);
    res.status(500).json({
      connected: false,
      error: 'Failed to connect to the database.',
      // Still return the config details for debugging purposes.
      details: {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        port: process.env.DB_PORT,
      }
    });
  }
};

module.exports = {
  getDatabaseStatus,
};