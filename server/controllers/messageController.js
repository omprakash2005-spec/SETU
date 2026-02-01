import pool from '../config/database.js';
import { uploadFileToCloudinary } from '../utils/uploadHelpers.js';

/**
 * Get or create a conversation between two users
 * Requires connection verification middleware
 */
export const getOrCreateConversation = async (req, res) => {
    try {
        const userId = req.user.id;
        const receiverId = req.receiverId;
        const connectionId = req.connectionId;

        // Ensure participant IDs are ordered (smaller first)
        const participant1 = Math.min(userId, receiverId);
        const participant2 = Math.max(userId, receiverId);

        // Check if conversation already exists
        let conversation = await pool.query(
            `SELECT * FROM conversations 
       WHERE participant_1_id = $1 AND participant_2_id = $2`,
            [participant1, participant2]
        );

        // Create conversation if it doesn't exist
        if (conversation.rows.length === 0) {
            conversation = await pool.query(
                `INSERT INTO conversations 
         (participant_1_id, participant_2_id, connection_id)
         VALUES ($1, $2, $3)
         RETURNING *`,
                [participant1, participant2, connectionId]
            );
        }

        res.status(200).json({
            success: true,
            conversation: conversation.rows[0],
        });
    } catch (error) {
        console.error('Get/Create conversation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get or create conversation',
        });
    }
};

/**
 * Get all conversations for the authenticated user
 */
export const getUserConversations = async (req, res) => {
    try {
        const userId = req.user.id;

        const conversations = await pool.query(
            `SELECT 
        c.conversation_id,
        c.last_message_at,
        c.last_message_preview,
        CASE 
          WHEN c.participant_1_id = $1 THEN c.participant_1_unread_count
          ELSE c.participant_2_unread_count
        END as unread_count,
        CASE 
          WHEN c.participant_1_id = $1 THEN c.participant_2_id
          ELSE c.participant_1_id
        END as other_user_id,
        u.name as other_user_name,
        u.profile_image as other_user_avatar,
        u.role as other_user_role
       FROM conversations c
       JOIN users u ON (
         CASE 
           WHEN c.participant_1_id = $1 THEN c.participant_2_id
           ELSE c.participant_1_id
         END = u.id
       )
       WHERE c.participant_1_id = $1 OR c.participant_2_id = $1
       ORDER BY c.last_message_at DESC`,
            [userId]
        );

        res.status(200).json({
            success: true,
            conversations: conversations.rows,
            count: conversations.rows.length,
        });
    } catch (error) {
        console.error('Get user conversations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch conversations',
        });
    }
};

/**
 * Send a text message
 * Requires connection verification middleware
 */
export const sendTextMessage = async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user.id;
        const receiverId = req.receiverId;
        const { content } = req.body;

        // Validate content
        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Message content is required',
            });
        }

        if (content.length > 5000) {
            return res.status(400).json({
                success: false,
                message: 'Message content too long (max 5000 characters)',
            });
        }

        await client.query('BEGIN');

        // Get or create conversation
        const participant1 = Math.min(userId, receiverId);
        const participant2 = Math.max(userId, receiverId);

        let conversation = await client.query(
            `SELECT conversation_id FROM conversations 
       WHERE participant_1_id = $1 AND participant_2_id = $2`,
            [participant1, participant2]
        );

        let conversationId;
        if (conversation.rows.length === 0) {
            const newConv = await client.query(
                `INSERT INTO conversations 
         (participant_1_id, participant_2_id, connection_id)
         VALUES ($1, $2, $3)
         RETURNING conversation_id`,
                [participant1, participant2, req.connectionId]
            );
            conversationId = newConv.rows[0].conversation_id;
        } else {
            conversationId = conversation.rows[0].conversation_id;
        }

        // Create message
        const message = await client.query(
            `INSERT INTO messages 
       (conversation_id, sender_id, message_type, content)
       VALUES ($1, $2, 'text', $3)
       RETURNING *`,
            [conversationId, userId, content.trim()]
        );

        // Update conversation
        const unreadField = participant1 === receiverId ? 'participant_1_unread_count' : 'participant_2_unread_count';
        await client.query(
            `UPDATE conversations 
       SET last_message_at = NOW(),
           last_message_preview = $1,
           ${unreadField} = ${unreadField} + 1,
           updated_at = NOW()
       WHERE conversation_id = $2`,
            [content.trim().substring(0, 100), conversationId]
        );

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: message.rows[0],
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Send text message error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message',
        });
    } finally {
        client.release();
    }
};

/**
 * Send a file message (image, PDF, document)
 * Requires connection verification middleware
 */
export const sendFileMessage = async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user.id;
        const receiverId = req.receiverId;

        // Validate file upload
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'File is required',
            });
        }

        await client.query('BEGIN');

        // Get or create conversation
        const participant1 = Math.min(userId, receiverId);
        const participant2 = Math.max(userId, receiverId);

        let conversation = await client.query(
            `SELECT conversation_id FROM conversations 
       WHERE participant_1_id = $1 AND participant_2_id = $2`,
            [participant1, participant2]
        );

        let conversationId;
        if (conversation.rows.length === 0) {
            const newConv = await client.query(
                `INSERT INTO conversations 
         (participant_1_id, participant_2_id, connection_id)
         VALUES ($1, $2, $3)
         RETURNING conversation_id`,
                [participant1, participant2, req.connectionId]
            );
            conversationId = newConv.rows[0].conversation_id;
        } else {
            conversationId = conversation.rows[0].conversation_id;
        }

        // Upload file to Cloudinary
        const uploadResult = await uploadFileToCloudinary(
            req.file.buffer,
            'messages/files',
            'auto'
        );

        // Create message
        const message = await client.query(
            `INSERT INTO messages 
       (conversation_id, sender_id, message_type, content)
       VALUES ($1, $2, 'file', NULL)
       RETURNING *`,
            [conversationId, userId]
        );

        const messageId = message.rows[0].message_id;

        // Create attachment record
        const attachment = await client.query(
            `INSERT INTO message_attachments 
       (message_id, file_url, file_type, file_size, original_filename, mime_type, cloudinary_public_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [
                messageId,
                uploadResult.secure_url,
                req.file.mimetype,
                req.file.size,
                req.file.originalname,
                req.file.mimetype,
                uploadResult.public_id,
            ]
        );

        // Update conversation
        const unreadField = participant1 === receiverId ? 'participant_1_unread_count' : 'participant_2_unread_count';
        const preview = `📎 ${req.file.originalname}`;
        await client.query(
            `UPDATE conversations 
       SET last_message_at = NOW(),
           last_message_preview = $1,
           ${unreadField} = ${unreadField} + 1,
           updated_at = NOW()
       WHERE conversation_id = $2`,
            [preview, conversationId]
        );

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: {
                ...message.rows[0],
                attachment: attachment.rows[0],
            },
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Send file message error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send file message',
        });
    } finally {
        client.release();
    }
};

/**
 * Send a voice message
 * Requires connection verification middleware
 */
export const sendVoiceMessage = async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user.id;
        const receiverId = req.receiverId;

        // Validate audio upload
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Audio file is required',
            });
        }

        await client.query('BEGIN');

        // Get or create conversation
        const participant1 = Math.min(userId, receiverId);
        const participant2 = Math.max(userId, receiverId);

        let conversation = await client.query(
            `SELECT conversation_id FROM conversations 
       WHERE participant_1_id = $1 AND participant_2_id = $2`,
            [participant1, participant2]
        );

        let conversationId;
        if (conversation.rows.length === 0) {
            const newConv = await client.query(
                `INSERT INTO conversations 
         (participant_1_id, participant_2_id, connection_id)
         VALUES ($1, $2, $3)
         RETURNING conversation_id`,
                [participant1, participant2, req.connectionId]
            );
            conversationId = newConv.rows[0].conversation_id;
        } else {
            conversationId = conversation.rows[0].conversation_id;
        }

        // Upload audio to Cloudinary
        const uploadResult = await uploadFileToCloudinary(
            req.file.buffer,
            'messages/voice',
            'video' // Cloudinary uses 'video' resource type for audio
        );

        // Create message
        const message = await client.query(
            `INSERT INTO messages 
       (conversation_id, sender_id, message_type, content)
       VALUES ($1, $2, 'voice', NULL)
       RETURNING *`,
            [conversationId, userId]
        );

        const messageId = message.rows[0].message_id;

        // Create attachment record
        const attachment = await client.query(
            `INSERT INTO message_attachments 
       (message_id, file_url, file_type, file_size, original_filename, mime_type, cloudinary_public_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [
                messageId,
                uploadResult.secure_url,
                req.file.mimetype,
                req.file.size,
                req.file.originalname,
                req.file.mimetype,
                uploadResult.public_id,
            ]
        );

        // Update conversation
        const unreadField = participant1 === receiverId ? 'participant_1_unread_count' : 'participant_2_unread_count';
        await client.query(
            `UPDATE conversations 
       SET last_message_at = NOW(),
           last_message_preview = '🎤 Voice message',
           ${unreadField} = ${unreadField} + 1,
           updated_at = NOW()
       WHERE conversation_id = $2`,
            [conversationId]
        );

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: {
                ...message.rows[0],
                attachment: attachment.rows[0],
            },
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Send voice message error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send voice message',
        });
    } finally {
        client.release();
    }
};

/**
 * Get chat history with pagination
 * Requires connection verification middleware
 */
export const getChatHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const receiverId = req.receiverId;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const offset = parseInt(req.query.offset) || 0;

        // Get conversation
        const participant1 = Math.min(userId, receiverId);
        const participant2 = Math.max(userId, receiverId);

        const conversation = await pool.query(
            `SELECT conversation_id FROM conversations 
       WHERE participant_1_id = $1 AND participant_2_id = $2`,
            [participant1, participant2]
        );

        if (conversation.rows.length === 0) {
            return res.status(200).json({
                success: true,
                messages: [],
                pagination: { limit, offset, total: 0 },
            });
        }

        const conversationId = conversation.rows[0].conversation_id;

        // Get messages with attachments
        const messages = await pool.query(
            `SELECT 
        m.message_id,
        m.sender_id,
        u.name as sender_name,
        m.message_type,
        m.content,
        m.is_read,
        m.read_at,
        m.created_at,
        a.attachment_id,
        a.file_url,
        a.file_type,
        a.file_size,
        a.original_filename
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       LEFT JOIN message_attachments a ON m.message_id = a.message_id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
            [conversationId, limit, offset]
        );

        // Get total count
        const countResult = await pool.query(
            `SELECT COUNT(*) as total FROM messages WHERE conversation_id = $1`,
            [conversationId]
        );

        // Format messages
        const formattedMessages = messages.rows.map(msg => ({
            message_id: msg.message_id,
            sender_id: msg.sender_id,
            sender_name: msg.sender_name,
            message_type: msg.message_type,
            content: msg.content,
            is_read: msg.is_read,
            read_at: msg.read_at,
            created_at: msg.created_at,
            attachment: msg.attachment_id ? {
                attachment_id: msg.attachment_id,
                file_url: msg.file_url,
                file_type: msg.file_type,
                file_size: msg.file_size,
                original_filename: msg.original_filename,
            } : null,
        }));

        res.status(200).json({
            success: true,
            messages: formattedMessages,
            pagination: {
                limit,
                offset,
                total: parseInt(countResult.rows[0].total),
            },
        });
    } catch (error) {
        console.error('Get chat history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch chat history',
        });
    }
};

/**
 * Mark messages as read
 * Requires connection verification middleware
 */
export const markMessagesAsRead = async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user.id;
        const receiverId = req.receiverId;
        const { message_ids } = req.body;

        if (!message_ids || !Array.isArray(message_ids) || message_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'message_ids array is required',
            });
        }

        await client.query('BEGIN');

        // Get conversation
        const participant1 = Math.min(userId, receiverId);
        const participant2 = Math.max(userId, receiverId);

        const conversation = await client.query(
            `SELECT conversation_id FROM conversations 
       WHERE participant_1_id = $1 AND participant_2_id = $2`,
            [participant1, participant2]
        );

        if (conversation.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found',
            });
        }

        const conversationId = conversation.rows[0].conversation_id;

        // Mark messages as read (only messages sent by the other user)
        const result = await client.query(
            `UPDATE messages 
       SET is_read = TRUE, read_at = NOW(), updated_at = NOW()
       WHERE message_id = ANY($1)
         AND conversation_id = $2
         AND sender_id = $3
         AND is_read = FALSE
       RETURNING message_id`,
            [message_ids, conversationId, receiverId]
        );

        const markedCount = result.rows.length;

        // Update unread count
        if (markedCount > 0) {
            const unreadField = participant1 === userId ? 'participant_1_unread_count' : 'participant_2_unread_count';
            await client.query(
                `UPDATE conversations 
         SET ${unreadField} = GREATEST(${unreadField} - $1, 0),
             updated_at = NOW()
         WHERE conversation_id = $2`,
                [markedCount, conversationId]
            );
        }

        await client.query('COMMIT');

        res.status(200).json({
            success: true,
            message: `${markedCount} message(s) marked as read`,
            marked_count: markedCount,
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Mark messages as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark messages as read',
        });
    } finally {
        client.release();
    }
};

/**
 * Delete a message (sender only)
 * DELETE /api/messages/:messageId
 */
export const deleteMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { messageId } = req.params;

        // Check if message exists and user is the sender
        const messageCheck = await pool.query(
            'SELECT sender_id FROM messages WHERE message_id = $1',
            [messageId]
        );

        if (messageCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Message not found',
            });
        }

        if (messageCheck.rows[0].sender_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own messages',
            });
        }

        // Delete the message (attachments will be cascade deleted)
        await pool.query(
            'DELETE FROM messages WHERE message_id = $1',
            [messageId]
        );

        res.status(200).json({
            success: true,
            message: 'Message deleted successfully',
        });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete message',
        });
    }
};
