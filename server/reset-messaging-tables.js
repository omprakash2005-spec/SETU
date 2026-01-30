import pool from './config/database.js';

const resetMessagingTables = async () => {
    const client = await pool.connect();

    try {
        console.log('\n🔄 Resetting messaging tables...\n');

        // Drop existing tables in reverse order (due to foreign keys)
        console.log('Dropping existing tables...');
        await client.query('DROP TABLE IF EXISTS message_attachments CASCADE');
        await client.query('DROP TABLE IF EXISTS messages CASCADE');
        await client.query('DROP TABLE IF EXISTS conversations CASCADE');
        console.log('✅ Old tables dropped\n');

        // Create conversations table
        console.log('Creating conversations table...');
        await client.query(`
      CREATE TABLE conversations (
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
        console.log('✅ conversations\n');

        // Create messages table
        console.log('Creating messages table...');
        await client.query(`
      CREATE TABLE messages (
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
        console.log('✅ messages\n');

        // Create message_attachments table
        console.log('Creating message_attachments table...');
        await client.query(`
      CREATE TABLE message_attachments (
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
        console.log('✅ message_attachments\n');

        // Create indexes
        console.log('Creating indexes...');
        await client.query('CREATE INDEX idx_conversations_participants ON conversations(participant_1_id, participant_2_id)');
        await client.query('CREATE INDEX idx_conversations_participant_1 ON conversations(participant_1_id)');
        await client.query('CREATE INDEX idx_conversations_participant_2 ON conversations(participant_2_id)');
        await client.query('CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC)');
        await client.query('CREATE INDEX idx_messages_sender ON messages(sender_id)');
        await client.query('CREATE INDEX idx_attachments_message ON message_attachments(message_id)');
        console.log('✅ All indexes created\n');

        console.log('✅ Messaging tables successfully created!\n');
        console.log('You can now use the messaging feature.\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        process.exit(0);
    }
};

resetMessagingTables();
