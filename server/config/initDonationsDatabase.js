import pool from "./database.js";

export const initDonationsDatabase = async () => {
  try {
    console.log("🔧 Initializing donations database...");

    // Create donations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS donations (
        donation_id SERIAL PRIMARY KEY,

        -- use users.id since your users table has id
        alumni_id INT NOT NULL,

        alumni_name VARCHAR(255),
        alumni_email VARCHAR(255) NOT NULL,

        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        status VARCHAR(50) DEFAULT 'pending',

        stripe_payment_intent_id VARCHAR(255),
        stripe_session_id VARCHAR(255),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_alumni
          FOREIGN KEY (alumni_id)
          REFERENCES users(id)
          ON DELETE CASCADE
      );
    `);

    // Indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_donations_alumni_id ON donations(alumni_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at DESC);
    `);

    console.log("✅ Donations database initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing donations database:", error);
    throw error;
  }
};
