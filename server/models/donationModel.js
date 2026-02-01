import pool from "../config/database.js";

export const createDonation = async (donationData) => {
  const {
    alumni_id,
    alumni_name,
    alumni_email,
    amount,
    currency,
    status,
    stripe_payment_intent_id,
    stripe_session_id,
  } = donationData;

  const result = await pool.query(
    `INSERT INTO donations 
    (alumni_id, alumni_name, alumni_email, amount, currency, status, stripe_payment_intent_id, stripe_session_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      alumni_id,
      alumni_name,
      alumni_email,
      amount,
      currency || "INR",
      status || "pending",
      stripe_payment_intent_id,
      stripe_session_id,
    ]
  );

  return result.rows[0];
};

export const updateDonationStatus = async (sessionId, status) => {
  const result = await pool.query(
    `UPDATE donations 
     SET status = $1, updated_at = CURRENT_TIMESTAMP
     WHERE stripe_session_id = $2
     RETURNING *`,
    [status, sessionId]
  );

  return result.rows[0];
};

export const getDonationBySessionId = async (sessionId) => {
  const result = await pool.query(
    `SELECT * FROM donations WHERE stripe_session_id = $1`,
    [sessionId]
  );

  return result.rows[0];
};

// ✅ FIXED: show both pending + success (so recent donations will always show)
export const getRecentDonations = async (limit = 10) => {
  const result = await pool.query(
    `SELECT 
      donation_id,
      alumni_name,
      amount,
      currency,
      status,
      created_at
    FROM donations 
    WHERE status IN ('success', 'pending')
    ORDER BY created_at DESC 
    LIMIT $1`,
    [limit]
  );

  return result.rows;
};

// ✅ FIXED: show both pending + success for alumni history
export const getDonationsByAlumni = async (alumniId) => {
  const result = await pool.query(
    `SELECT 
      donation_id,
      alumni_id,
      alumni_name,
      alumni_email,
      amount,
      currency,
      status,
      created_at
    FROM donations 
    WHERE alumni_id = $1 AND status IN ('success', 'pending')
    ORDER BY created_at DESC`,
    [alumniId]
  );

  return result.rows;
};

// ✅ Keep analytics only for SUCCESS (recommended)
export const getTotalDonations = async () => {
  const result = await pool.query(
    `SELECT 
      COALESCE(SUM(amount), 0) as total_amount,
      COUNT(*) as total_count
    FROM donations 
    WHERE status = 'success'`
  );

  return result.rows[0];
};

export const getAlumniDonationTotal = async (alumniId) => {
  const result = await pool.query(
    `SELECT 
      COALESCE(SUM(amount), 0) as total_amount,
      COUNT(*) as total_count
    FROM donations 
    WHERE alumni_id = $1 AND status = 'success'`,
    [alumniId]
  );

  return result.rows[0];
};
