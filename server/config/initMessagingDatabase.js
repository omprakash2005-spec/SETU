import pool from './database.js';

/**
 * Initialize messaging database schema
 * Creates tables for conversations, messages, and message attachments
 */
export const initMessagingDatabase = async () => {
    const client = await pool.connect();

    try {
        console.log('🔄 Initializing messaging database schema...');

        // 1. Create conversations table
        await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        conversation_id SERIAL PRIMARY KEY,
        participant_1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        participant_2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        connection_id INTEGER NOT NULL REFERENCES mentor_connections(connection_id) ON DELETE CASCADE,
        last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_message_preview TEXT,
        participant_1_unread_count INTEGER DEFAULT 0,
        participant_2_unread_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_conversation UNIQUE(participant_1_id, participant_2_id),
        CONSTRAINT ordered_participants CHECK (participant_1_id < participant_2_id)
      );
    `);

        // 2. Create messages table
        await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        message_id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('text', 'file', 'voice')),
        content TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // 3. Create message attachments table
        await client.query(`
      CREATE TABLE IF NOT EXISTS message_attachments (
        attachment_id SERIAL PRIMARY KEY,
        message_id INTEGER NOT NULL REFERENCES messages(message_id) ON DELETE CASCADE,
        file_url TEXT NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        file_size INTEGER NOT NULL,
        original_filename VARCHAR(255),
        mime_type VARCHAR(100),
        cloudinary_public_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // 4. Create indexes for performance
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_conversations_participants
      ON conversations(participant_1_id, participant_2_id);
    `);

        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_conversations_participant_1
      ON conversations(participant_1_id);
    `);

        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_conversations_participant_2
      ON conversations(participant_2_id);
    `);

        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation
      ON messages(conversation_id, created_at DESC);
    `);

        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_sender
      ON messages(sender_id);
    `);

        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_attachments_message
      ON message_attachments(message_id);
    `);

        console.log('✅ Messaging database schema initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing messaging database:', error);
        throw error;
    } finally {
        client.release();
    }
};

export default initMessagingDatabase;
