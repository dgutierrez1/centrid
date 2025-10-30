/**
 * Test script to verify enhanced logging functionality
 */

const supabaseUrl = 'https://xennuhfmnucybtyzfgcl.supabase.co/functions/v1';
const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhlbm51aGZtbm1jeWJ0eXpmZ2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0MzAyMDYsImV4cCI6MjA1MTAwNjIwNn0.N9F2B8e_oJbQ4j_3p-6J_4rYtNJsW8j0n7Q0d4L3s6k';

async function testCreateThreadLogging() {
  console.log('\n🧪 Testing create-thread function logging...');

  try {
    const response = await fetch(`${supabaseUrl}/create-thread`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Test Thread for Logging ' + new Date().toISOString()
      })
    });

    const result = await response.json();
    console.log('✅ Create-thread response:', response.status, result);

    if (result.data?.threadId) {
      console.log('📝 Thread created with ID:', result.data.threadId);
      return result.data.threadId;
    }
  } catch (error) {
    console.error('❌ Create-thread error:', error.message);
  }
  return null;
}

async function testStreamAgentLogging(threadId) {
  if (!threadId) {
    console.log('⚠️ Skipping stream-agent test - no thread ID');
    return;
  }

  console.log('\n🧪 Testing stream-agent function logging...');

  try {
    // First, create a message in the thread
    const createMessageResponse = await fetch(`${supabaseUrl}/thread-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        threadId: threadId,
        content: 'Test message for logging verification',
        role: 'user'
      })
    });

    if (createMessageResponse.ok) {
      const messageData = await createMessageResponse.json();
      console.log('✅ Message created:', messageData);

      if (messageData.data?.messageId) {
        // Test the streaming agent
        console.log('🔄 Testing AI streaming with logging...');

        const streamUrl = `${supabaseUrl}/stream-agent?requestId=req-test-${Date.now()}&threadId=${threadId}&messageId=${messageData.data.messageId}`;

        const streamResponse = await fetch(streamUrl, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (streamResponse.ok) {
          console.log('✅ Stream-agent responded, reading events...');

          const reader = streamResponse.body.getReader();
          const decoder = new TextDecoder();
          let eventCount = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const events = chunk.split('\n\n');

            for (const event of events) {
              if (event.startsWith('data: ')) {
                try {
                  const data = JSON.parse(event.slice(6));
                  eventCount++;
                  console.log(`📨 Event ${eventCount}:`, data.type);

                  if (data.type === 'completion') {
                    console.log('✅ Streaming completed');
                    break;
                  }
                } catch (e) {
                  // Ignore parsing errors for non-JSON events
                }
              }
            }
          }

          console.log(`📊 Total events received: ${eventCount}`);
        } else {
          console.error('❌ Stream-agent error:', streamResponse.status, await streamResponse.text());
        }
      }
    } else {
      console.error('❌ Failed to create message:', createMessageResponse.status, await createMessageResponse.text());
    }
  } catch (error) {
    console.error('❌ Stream-agent error:', error.message);
  }
}

async function testErrorLogging() {
  console.log('\n🧪 Testing error logging...');

  try {
    const response = await fetch(`${supabaseUrl}/create-thread`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // Invalid data to trigger error
        title: '',  // Empty title should trigger validation error
        invalidField: 'test'
      })
    });

    const result = await response.json();
    console.log('🚨 Error test response:', response.status, result);

    if (response.status >= 400) {
      console.log('✅ Error logging test - validation error triggered');
    }
  } catch (error) {
    console.error('❌ Error logging test failed:', error.message);
  }
}

async function runLoggingTests() {
  console.log('🚀 Starting logging verification tests...\n');
  console.log('📋 Check Supabase Dashboard → Edge Functions → Logs to see the enhanced logging output');
  console.log('🔍 Look for structured JSON logs with fields like: level, message, timestamp, context, duration, etc.\n');

  // Test 1: Create thread (should show successful operation logs)
  const threadId = await testCreateThreadLogging();

  // Test 2: Stream agent (should show streaming logs, performance timing, etc.)
  await testStreamAgentLogging(threadId);

  // Test 3: Error scenario (should show error logs with context)
  await testErrorLogging();

  console.log('\n✅ Logging tests completed!');
  console.log('\n📖 Next steps:');
  console.log('1. Go to Supabase Dashboard → Edge Functions → Logs');
  console.log('2. Filter by function name (e.g., function:"create-thread")');
  console.log('3. Look for structured JSON logs with request IDs and timing information');
  console.log('4. Compare the new logs with the old console.error format');
  console.log('\n🎯 You should see:');
  console.log('- Structured JSON instead of plain text');
  console.log('- Request IDs for correlation');
  console.log('- Performance timing (duration fields)');
  console.log('- Context information (userId, threadId, etc.)');
  console.log('- Proper error objects with stack traces');
}

// Run the tests
runLoggingTests().catch(console.error);