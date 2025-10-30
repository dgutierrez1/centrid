#!/usr/bin/env node

/**
 * Test script to debug SSE streaming
 * Tests both POST /messages and GET /stream endpoints
 */

const API_URL = 'http://localhost:54321/functions/v1/api';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE5MjI2MDkwMjJ9.DxlNMiMdNfYYCrmkO_MJ0_qBLYTjYfLvjfHhbGP8PaI';

async function test() {
  try {
    console.log('🚀 Starting SSE streaming test...\n');

    // Step 1: Create a thread
    console.log('📝 Step 1: Creating thread...');
    const threadRes = await fetch(`${API_URL}/threads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: 'Test Thread' }),
    });

    if (!threadRes.ok) {
      throw new Error(`Failed to create thread: ${threadRes.status} ${await threadRes.text()}`);
    }

    const threadData = await threadRes.json();
    const threadId = threadData.data.id;
    console.log(`✅ Thread created: ${threadId}\n`);

    // Step 2: Send message to trigger execution
    console.log('📨 Step 2: Sending message...');
    const messageRes = await fetch(`${API_URL}/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'Hello, how are you?',
        contextReferences: [],
      }),
    });

    if (!messageRes.ok) {
      throw new Error(`Failed to send message: ${messageRes.status} ${await messageRes.text()}`);
    }

    const messageData = await messageRes.json();
    const requestId = messageData.data._embedded?.requestId;
    if (!requestId) {
      throw new Error('No requestId in response');
    }

    console.log(`✅ Message sent with requestId: ${requestId}\n`);

    // Step 3: Connect to streaming endpoint
    console.log('🔗 Step 3: Connecting to SSE stream...');
    const streamRes = await fetch(`${API_URL}/agent-requests/${requestId}/stream`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Accept': 'text/event-stream',
      },
    });

    if (!streamRes.ok) {
      throw new Error(`Failed to connect to stream: ${streamRes.status} ${await streamRes.text()}`);
    }

    console.log(`✅ Connected to stream (status: ${streamRes.status})\n`);

    // Step 4: Read stream events
    console.log('📡 Step 4: Reading stream events (waiting 30 seconds)...\n');

    const reader = streamRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let eventCount = 0;
    let timeoutHandle;

    // Timeout after 30 seconds
    const timeoutPromise = new Promise((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reader.cancel();
        reject(new Error('Stream timeout - no events received after 30 seconds'));
      }, 30000);
    });

    try {
      const readLoop = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log('\n✅ Stream ended');
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('event: ')) {
                const eventType = line.slice(7);
                console.log(`\n📦 Event received: ${eventType}`);
              } else if (line.startsWith('data: ')) {
                eventCount++;
                try {
                  const data = JSON.parse(line.slice(6));
                  console.log(`   Data:`, JSON.stringify(data).substring(0, 100) + (JSON.stringify(data).length > 100 ? '...' : ''));
                } catch (e) {
                  console.log(`   Data: ${line.slice(6).substring(0, 100)}`);
                }
              }
            }
          }
        } catch (error) {
          if (error.name === 'AbortError') {
            return;
          }
          throw error;
        }
      };

      await Promise.race([readLoop(), timeoutPromise]);
    } finally {
      clearTimeout(timeoutHandle);
    }

    console.log(`\n\n📊 Summary:`);
    console.log(`   Events received: ${eventCount}`);
    if (eventCount === 0) {
      console.log('   ❌ ISSUE: No events received - check backend logs');
    } else {
      console.log('   ✅ Streaming is working!');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check that Supabase is running: supabase status');
    console.error('2. Check backend logs: supabase functions logs');
    console.error('3. Verify ANTHROPIC_API_KEY is set in Supabase secrets');
    process.exit(1);
  }
}

test();
