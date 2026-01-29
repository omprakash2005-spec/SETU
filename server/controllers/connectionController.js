import pool from '../config/database.js';

/**
 * Create a new mentor connection request
 * POST /api/connections
 */
export const createConnection = async (req, res) => {
  try {
    const { id: requesterId, role: requesterRole } = req.user;
    const {
  receiver_id = null,
  receiver_name = null,
  mentor_name = null,
  mentor_skill = null,
  mentor_avatar = null,
  match_score = 0,
  mentor_identifier = null
} = req.body;


    // Validate required fields
    if (!receiver_id && !mentor_name) {
      return res.status(400).json({
        success: false,
        message: 'Either receiver_id or mentor_name is required',
      });
    }

    // Prevent self-connection
    if (receiver_id && receiver_id === requesterId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot connect with yourself',
      });
    }

    // Check if connection request already exists (in any direction)
    if (receiver_id) {
      const existingConnection = await pool.query(
        `SELECT connection_id, request_status FROM mentor_connections 
         WHERE ((requester_id = $1 AND receiver_id = $2) 
            OR (requester_id = $2 AND receiver_id = $1))
         AND request_status IN ('pending', 'accepted')`,
        [requesterId, receiver_id]
      );

      if (existingConnection.rows.length > 0) {
        const status = existingConnection.rows[0].request_status;
        return res.status(409).json({
          success: false,
          message: status === 'accepted' ? 'Connection already exists' : 'Connection request already sent',
          alreadyConnected: status === 'accepted',
        });
      }
    }

    // Get requester name from users table
    const requesterQuery = await pool.query(
      'SELECT name FROM users WHERE id = $1',
      [requesterId]
    );
    const requesterName = requesterQuery.rows[0]?.name || 'Unknown';

    // Get receiver details if receiver_id provided
    let receiverRole = null;
    let finalReceiverName = receiver_name;
    
    if (receiver_id) {
      const receiverQuery = await pool.query(
        'SELECT name, role FROM users WHERE id = $1',
        [receiver_id]
      );
      if (receiverQuery.rows.length > 0) {
        receiverRole = receiverQuery.rows[0].role;
        finalReceiverName = receiverQuery.rows[0].name;
      }
    }

    // Create new connection request
    const result = await pool.query(
      `INSERT INTO mentor_connections 
       (requester_id, requester_role, requester_name, receiver_id, receiver_role, receiver_name, 
        mentor_name, mentor_skill, mentor_avatar, match_score, mentor_identifier, request_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
       RETURNING *`,
      [requesterId, requesterRole, requesterName, receiver_id, receiverRole, finalReceiverName,
       mentor_name, mentor_skill, mentor_avatar, match_score, mentor_identifier]
    );

    res.status(201).json({
      success: true,
      message: 'Connection request sent successfully',
      connection: result.rows[0],
    });
  } catch (error) {
    console.error('Create connection error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to create connection request',
    });
  }
};

/**
 * Get all accepted connections for current user (bi-directional)
 * GET /api/connections
 */
export const getConnections = async (req, res) => {
  try {
    const { id: userId } = req.user;

    const result = await pool.query(
      `SELECT 
        mc.connection_id,
        CASE 
          WHEN mc.requester_id = $1 THEN mc.receiver_id
          ELSE mc.requester_id
        END as connection_user_id,
        CASE 
          WHEN mc.requester_id = $1 THEN mc.receiver_name
          ELSE mc.requester_name
        END as mentor_name,
        mc.mentor_skill,
        COALESCE(u.profile_image, mc.mentor_avatar) as mentor_avatar,
        mc.match_score,
        mc.mentor_identifier,
        mc.created_at
       FROM mentor_connections mc
       LEFT JOIN users u ON (
         CASE 
           WHEN mc.requester_id = $1 THEN mc.receiver_id
           ELSE mc.requester_id
         END = u.id
       )
       WHERE (mc.requester_id = $1 OR mc.receiver_id = $1)
         AND mc.request_status = 'accepted'
       ORDER BY mc.created_at DESC`,
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
 * Get pending connection requests (incoming requests where current user is receiver)
 * GET /api/connections/requests/pending
 */
export const getPendingRequests = async (req, res) => {
  try {
    const { id: userId } = req.user;

    const result = await pool.query(
      `SELECT 
        connection_id as request_id,
        requester_id as student_id,
        requester_name as student_name,
        requester_role as student_role,
        mentor_skill as student_skill,
        created_at
       FROM mentor_connections
       WHERE receiver_id = $1
         AND request_status = 'pending'
       ORDER BY created_at DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      requests: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending requests',
    });
  }
};

/**
 * Accept a connection request
 * POST /api/connections/accept/:requestId
 */
export const acceptRequest = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { requestId } = req.params;

    // Verify the request exists and user is the receiver
    const request = await pool.query(
      'SELECT * FROM mentor_connections WHERE connection_id = $1 AND receiver_id = $2 AND request_status = $3',
      [requestId, userId, 'pending']
    );

    if (request.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Connection request not found or already processed',
      });
    }

    // Update request status to accepted
    await pool.query(
      'UPDATE mentor_connections SET request_status = $1 WHERE connection_id = $2',
      ['accepted', requestId]
    );

    res.status(200).json({
      success: true,
      message: 'Connection request accepted successfully',
    });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept connection request',
    });
  }
};

/**
 * Reject a connection request
 * POST /api/connections/reject/:requestId
 */
export const rejectRequest = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { requestId } = req.params;

    // Verify the request exists and user is the receiver
    const request = await pool.query(
      'SELECT * FROM mentor_connections WHERE connection_id = $1 AND receiver_id = $2 AND request_status = $3',
      [requestId, userId, 'pending']
    );

    if (request.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Connection request not found or already processed',
      });
    }

    // Update request status to rejected (or delete it)
    await pool.query(
      'UPDATE mentor_connections SET request_status = $1 WHERE connection_id = $2',
      ['rejected', requestId]
    );

    res.status(200).json({
      success: true,
      message: 'Connection request rejected',
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject connection request',
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
      `SELECT connection_id, request_status FROM mentor_connections 
       WHERE (requester_id = $1 OR receiver_id = $1)
         AND (requester_name = $2 OR receiver_name = $2 OR mentor_name = $2)`,
      [userId, mentorName]
    );

    const isConnected = result.rows.length > 0 && result.rows[0].request_status === 'accepted';
    const isPending = result.rows.length > 0 && result.rows[0].request_status === 'pending';

    res.status(200).json({
      success: true,
      isConnected,
      isPending,
      status: result.rows.length > 0 ? result.rows[0].request_status : null,
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

    // Verify ownership (either requester or receiver)
    const connection = await pool.query(
      'SELECT requester_id, receiver_id FROM mentor_connections WHERE connection_id = $1',
      [connectionId]
    );

    if (connection.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found',
      });
    }

    const { requester_id, receiver_id } = connection.rows[0];
    if (requester_id !== userId && receiver_id !== userId) {
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
