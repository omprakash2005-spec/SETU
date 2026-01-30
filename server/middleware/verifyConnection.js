import pool from '../config/database.js';

/**
 * Middleware to verify that two users have an accepted connection
 * before allowing messaging operations
 * 
 * Expects:
 * - req.user.id (from authentication middleware)
 * - req.params.receiverId OR req.body.receiver_id
 * 
 * Sets:
 * - req.connectionId (if connection exists)
 * - req.receiverId (normalized receiver ID)
 */
export const verifyConnection = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const receiverId = parseInt(req.params.receiverId || req.body.receiver_id);

        // Validate receiver ID
        if (!receiverId || isNaN(receiverId)) {
            return res.status(400).json({
                success: false,
                message: 'Valid receiver ID is required',
            });
        }

        // Prevent messaging yourself
        if (receiverId === userId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot message yourself',
            });
        }

        // Check if connection exists and is accepted (bidirectional check)
        const connection = await pool.query(
            `SELECT connection_id, request_status 
       FROM mentor_connections 
       WHERE ((requester_id = $1 AND receiver_id = $2) 
          OR (requester_id = $2 AND receiver_id = $1))
         AND request_status = 'accepted'`,
            [userId, receiverId]
        );

        if (connection.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You can only message users you are connected with',
            });
        }

        // Attach connection info to request
        req.connectionId = connection.rows[0].connection_id;
        req.receiverId = receiverId;

        next();
    } catch (error) {
        console.error('Connection verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to verify connection',
        });
    }
};
