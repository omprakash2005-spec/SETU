import pool from '../config/database.js';

/**
 * Save or update user location
 */
export const saveLocation = async (userId, locationData) => {
    const { latitude, longitude, location_type, address } = locationData;

    // Check if user already has a location
    const existing = await pool.query(
        'SELECT location_id FROM user_locations WHERE user_id = $1',
        [userId]
    );

    if (existing.rows.length > 0) {
        // Update existing location
        const result = await pool.query(
            `UPDATE user_locations 
       SET latitude = $1, longitude = $2, location_type = $3, address = $4, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $5
       RETURNING *`,
            [latitude, longitude, location_type, address, userId]
        );
        return result.rows[0];
    } else {
        // Insert new location
        const result = await pool.query(
            `INSERT INTO user_locations (user_id, latitude, longitude, location_type, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [userId, latitude, longitude, location_type, address]
        );
        return result.rows[0];
    }
};

/**
 * Get user's location
 */
export const getUserLocation = async (userId) => {
    const result = await pool.query(
        'SELECT * FROM user_locations WHERE user_id = $1',
        [userId]
    );
    return result.rows[0];
};

/**
 * Get locations of connected users within a radius
 * Uses Haversine formula to calculate distance
 */
export const getNearbyConnectedLocations = async (userId, userLat, userLon, radiusKm = 50) => {
    const result = await pool.query(
        `SELECT 
      ul.location_id,
      ul.user_id,
      ul.latitude,
      ul.longitude,
      ul.location_type,
      ul.updated_at,
      u.name,
      u.email,
      u.role,
      u.profile_image,
      u.college,
      u.batch_year,
      u.department,
      u.current_company,
      u.current_position,
      u.bio,
      u.skills,
      u.linkedin_url,
      u.github_url,
      (
        6371 * acos(
          cos(radians($2)) * cos(radians(ul.latitude)) * 
          cos(radians(ul.longitude) - radians($3)) + 
          sin(radians($2)) * sin(radians(ul.latitude))
        )
      ) AS distance_km
    FROM user_locations ul
    INNER JOIN users u ON ul.user_id = u.id
    WHERE ul.user_id != $1
    AND u.is_active = true
    AND EXISTS (
      SELECT 1 FROM mentor_connections mc
      WHERE (
        (mc.user_id = $1 AND mc.mentor_identifier = ul.user_id::TEXT) OR
        (mc.user_id = ul.user_id AND mc.mentor_identifier = $1::TEXT)
      )
    )
    AND (
      6371 * acos(
        cos(radians($2)) * cos(radians(ul.latitude)) * 
        cos(radians(ul.longitude) - radians($3)) + 
        sin(radians($2)) * sin(radians(ul.latitude))
      )
    ) <= $4
    ORDER BY distance_km ASC`,
        [userId, userLat, userLon, radiusKm]
    );

    return result.rows;
};

/**
 * Delete user location
 */
export const deleteLocation = async (userId) => {
    const result = await pool.query(
        'DELETE FROM user_locations WHERE user_id = $1 RETURNING *',
        [userId]
    );
    return result.rows[0];
};

/**
 * Get all locations (for admin/debugging)
 */
export const getAllLocations = async () => {
    const result = await pool.query(
        `SELECT 
      ul.*,
      u.name,
      u.email,
      u.role
    FROM user_locations ul
    INNER JOIN users u ON ul.user_id = u.id
    ORDER BY ul.updated_at DESC`
    );
    return result.rows;
};
