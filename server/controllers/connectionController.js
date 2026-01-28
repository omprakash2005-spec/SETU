import pool from '../config/database.js';

/**
 * Create a new mentor connection
 * POST /api/connections
 */
export const createConnection = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { mentor_name, mentor_skill, mentor_avatar, match_score, mentor_identifier } = req.body;

    // Validate required fields
    if (!mentor_name) {
      return res.status(400).json({
        success: false,
        message: 'Mentor name is required',
      });
    }

    // Check if connection already exists
    const existingConnection = await pool.query(
      'SELECT connection_id FROM mentor_connections WHERE user_id = $1 AND mentor_name = $2',
      [userId, mentor_name]
    );

    if (existingConnection.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Connection already exists',
        alreadyConnected: true,
      });
    }

    // Create new connection
    const result = await pool.query(
      `INSERT INTO mentor_connections 
       (user_id, user_role, mentor_name, mentor_skill, mentor_avatar, match_score, mentor_identifier)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, role, mentor_name, mentor_skill, mentor_avatar, match_score, mentor_identifier]
    );

    res.status(201).json({
      success: true,
      message: 'Connection created successfully',
      connection: result.rows[0],
    });
  } catch (error) {
    console.error('Create connection error:', error);

    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Connection already exists',
        alreadyConnected: true,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create connection',
    });
  }
};

/**
 * Get all connections for current user
 * GET /api/connections
 */
export const getConnections = async (req, res) => {
  try {
    const { id: userId } = req.user;

    const result = await pool.query(
      `SELECT 
        connection_id,
        mentor_name,
        mentor_skill,
        mentor_avatar,
        match_score,
        mentor_identifier,
        created_at
       FROM mentor_connections
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      connections: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch connections',
    });
  }
};

/**
 * Check if user is connected with specific mentor
 * GET /api/connections/check/:mentorName
 */
export const checkConnection = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { mentorName } = req.params;

    const result = await pool.query(
      'SELECT connection_id FROM mentor_connections WHERE user_id = $1 AND mentor_name = $2',
      [userId, mentorName]
    );

    res.status(200).json({
      success: true,
      isConnected: result.rows.length > 0,
    });
  } catch (error) {
    console.error('Check connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check connection',
    });
  }
};

/**
 * Delete a connection
 * DELETE /api/connections/:connectionId
 */
export const deleteConnection = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { connectionId } = req.params;

    // Verify ownership
    const connection = await pool.query(
      'SELECT user_id FROM mentor_connections WHERE connection_id = $1',
      [connectionId]
    );

    if (connection.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found',
      });
    }

    if (connection.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this connection',
      });
    }

    await pool.query('DELETE FROM mentor_connections WHERE connection_id = $1', [connectionId]);

    res.status(200).json({
      success: true,
      message: 'Connection deleted successfully',
    });
  } catch (error) {
    console.error('Delete connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete connection',
    });
  }
};
