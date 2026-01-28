import pool from './database.js';

/**
 * Initialize User Locations Database Schema
 * Creates table for storing user map locations (separate from user profile)
 */

export const initLocationsDatabase = async () => {
    const client = await pool.connect();

    try {
        console.log('🔄 Initializing user locations database schema...');

        // Create user_locations table
        await client.query(`
      CREATE TABLE IF NOT EXISTS user_locations (
        location_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        location_type VARCHAR(20) NOT NULL CHECK (location_type IN ('manual', 'gps')),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
        console.log('✅ User locations table created/verified');

        // Create indexes for performance
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_locations_user_id 
      ON user_locations(user_id);
    `);

        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_locations_coordinates 
      ON user_locations(latitude, longitude);
    `);

        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_locations_updated_at 
      ON user_locations(updated_at DESC);
    `);

        console.log('✅ Indexes created/verified');

        console.log('✅ User locations database initialization complete!');
    } catch (error) {
        console.error('❌ Error initializing user locations database:', error);
        throw error;
    } finally {
        client.release();
    }
};

export default initLocationsDatabase;
