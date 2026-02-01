import pool from './config/database.js';

/**
 * Debug script to check mentor_connections and conversations
 * Run with: node server/check-connections.js
 */

const checkConnections = async () => {
    const client = await pool.connect();

    try {
        console.log('\n=== CHECKING MENTOR CONNECTIONS ===\n');

        // Get all accepted connections
        const connections = await client.query(`
      SELECT 
        connection_id,
        requester_id,
        requester_name,
        requester_role,
        receiver_id,
        receiver_name,
        receiver_role,
        request_status,
        created_at
      FROM mentor_connections
      WHERE request_status = 'accepted'
      ORDER BY created_at DESC
      LIMIT 10
    `);

        if (connections.rows.length === 0) {
            console.log('❌ No accepted connections found in mentor_connections table');
            console.log('\nTo test messaging, you need to:');
            console.log('1. Create a connection between two users');
            console.log('2. Set request_status to "accepted"');
            console.log('\nExample SQL:');
            console.log(`
INSERT INTO mentor_connections 
  (requester_id, requester_role, requester_name, receiver_id, receiver_role, receiver_name, request_status)
VALUES 
  (1, 'student', 'Student Name', 2, 'alumni', 'Alumni Name', 'accepted');
      `);
        } else {
            console.log(`✅ Found ${connections.rows.length} accepted connection(s):\n`);
            connections.rows.forEach((conn, i) => {
                console.log(`${i + 1}. Connection ID: ${conn.connection_id}`);
                console.log(`   ${conn.requester_name} (${conn.requester_role}, ID: ${conn.requester_id})`);
                console.log(`   ↔️  ${conn.receiver_name} (${conn.receiver_role}, ID: ${conn.receiver_id})`);
                console.log(`   Status: ${conn.request_status}`);
                console.log(`   Created: ${conn.created_at}\n`);
            });
        }

        // Get all users
        console.log('\n=== CHECKING USERS ===\n');
        const users = await client.query(`
      SELECT id, name, email, role
      FROM users
      ORDER BY id
      LIMIT 10
    `);

        console.log(`Found ${users.rows.length} user(s):\n`);
        users.rows.forEach(user => {
            console.log(`- ID: ${user.id}, Name: ${user.name}, Role: ${user.role}, Email: ${user.email}`);
        });

        // Check conversations
        console.log('\n=== CHECKING CONVERSATIONS ===\n');
        const conversations = await client.query(`
      SELECT 
        conversation_id,
        participant_1_id,
        participant_2_id,
        connection_id,
        last_message_preview,
        created_at
      FROM conversations
      ORDER BY created_at DESC
      LIMIT 10
    `);

        if (conversations.rows.length === 0) {
            console.log('❌ No conversations found (will be created when first message is sent)');
        } else {
            console.log(`✅ Found ${conversations.rows.length} conversation(s):\n`);
            conversations.rows.forEach((conv, i) => {
                console.log(`${i + 1}. Conversation ID: ${conv.conversation_id}`);
                console.log(`   Between User ${conv.participant_1_id} and User ${conv.participant_2_id}`);
                console.log(`   Connection ID: ${conv.connection_id}`);
                console.log(`   Last message: ${conv.last_message_preview || 'None'}\n`);
            });
        }

        console.log('\n=== SUMMARY ===\n');
        console.log(`Users: ${users.rows.length}`);
        console.log(`Accepted Connections: ${connections.rows.length}`);
        console.log(`Conversations: ${conversations.rows.length}`);
        console.log('\n');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        client.release();
        process.exit(0);
    }
};

checkConnections();
