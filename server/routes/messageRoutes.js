import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { verifyConnection } from '../middleware/verifyConnection.js';
import { uploadMessageFile, uploadAudio } from '../config/multer.js';
import * as messageController from '../controllers/messageController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Get all conversations for current user
 * GET /api/messages/conversations
 */
router.get('/conversations', messageController.getUserConversations);

/**
 * Get or create conversation with specific user
 * GET /api/messages/conversations/:receiverId
 * Requires: Connection verification
 */
router.get(
    '/conversations/:receiverId',
    verifyConnection,
    messageController.getOrCreateConversation
);

/**
 * Get chat history (paginated)
 * GET /api/messages/conversations/:receiverId/messages?limit=50&offset=0
 * Requires: Connection verification
 */
router.get(
    '/conversations/:receiverId/messages',
    verifyConnection,
    messageController.getChatHistory
);

/**
 * Send text message
 * POST /api/messages/conversations/:receiverId/messages/text
 * Body: { content: string }
 * Requires: Connection verification
 */
router.post(
    '/conversations/:receiverId/messages/text',
    verifyConnection,
    messageController.sendTextMessage
);

/**
 * Send file message (image, PDF, document)
 * POST /api/messages/conversations/:receiverId/messages/file
 * Content-Type: multipart/form-data
 * Form field: file (max 10MB)
 * Requires: Connection verification
 */
router.post(
    '/conversations/:receiverId/messages/file',
    verifyConnection,
    uploadMessageFile.single('file'),
    messageController.sendFileMessage
);

/**
 * Send voice message
 * POST /api/messages/conversations/:receiverId/messages/voice
 * Content-Type: multipart/form-data
 * Form field: audio (max 5MB)
 * Requires: Connection verification
 */
router.post(
    '/conversations/:receiverId/messages/voice',
    verifyConnection,
    uploadAudio.single('audio'),
    messageController.sendVoiceMessage
);

/**
 * Mark messages as read
 * PUT /api/messages/conversations/:receiverId/messages/read
 * Body: { message_ids: number[] }
 * Requires: Connection verification
 */
router.put(
    '/conversations/:receiverId/messages/read',
    verifyConnection,
    messageController.markMessagesAsRead
);

/**
 * Delete a message (sender only)
 * DELETE /api/messages/:messageId
 */
router.delete(
    '/:messageId',
    messageController.deleteMessage
);

export default router;
