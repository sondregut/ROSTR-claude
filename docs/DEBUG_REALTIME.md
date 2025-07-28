# Debugging Supabase Real-time Subscriptions

## Error Analysis

The error "Failed to subscribe to circle 1 messages" indicates that the real-time subscription is failing. Common causes:

1. **Real-time not enabled on tables**
2. **RLS policies blocking access**
3. **Authentication issues**
4. **Network/WebSocket connection problems**

## Steps to Fix

### 1. Enable Real-time on Tables

In Supabase Dashboard:
1. Go to Database → Replication
2. Enable replication for these tables:
   - `messages`
   - `typing_indicators`
   - `circle_message_reads`

### 2. Check RLS Policies

Run this SQL to verify RLS is enabled and policies exist:

```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('messages', 'typing_indicators', 'circle_message_reads');

-- List policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('messages', 'typing_indicators', 'circle_message_reads');
```

### 3. Test Direct Queries

Add this test to CircleChat component to verify basic access:

```typescript
// Test direct query access
const testDirectAccess = async () => {
  try {
    // Test 1: Can we read messages?
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('circle_id', circleId)
      .limit(1);
    
    console.log('Direct message query:', { messages, error: msgError });
    
    // Test 2: Can we insert messages?
    const { data: newMsg, error: insertError } = await supabase
      .from('messages')
      .insert({
        circle_id: circleId,
        sender_id: currentUserId,
        sender_name: currentUserName,
        sender_avatar: currentUserAvatar,
        content: 'Test message',
        message_type: 'text'
      })
      .select()
      .single();
    
    console.log('Insert test:', { newMsg, error: insertError });
    
    // Clean up test message if successful
    if (newMsg?.id) {
      await supabase.from('messages').delete().eq('id', newMsg.id);
    }
  } catch (err) {
    console.error('Direct access test failed:', err);
  }
};
```

### 4. Debug Real-time Connection

Add this to check WebSocket connection:

```typescript
// Check Supabase client real-time status
const checkRealtimeStatus = () => {
  const channels = supabase.getChannels();
  console.log('Active channels:', channels.map(ch => ({
    topic: ch.topic,
    state: ch.state,
    joined: ch.isJoined(),
    closed: ch.isClosed(),
    errored: ch.isErrored()
  })));
};
```

### 5. Simplified Subscription Test

Try a basic subscription without filters:

```typescript
const testBasicSubscription = () => {
  const channel = supabase
    .channel('test-messages')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages'
      },
      (payload) => {
        console.log('Basic subscription received:', payload);
      }
    )
    .subscribe((status, error) => {
      console.log('Basic subscription status:', status, error);
    });
  
  return () => channel.unsubscribe();
};
```

### 6. Authentication Check

```typescript
// Verify user is authenticated
const checkAuth = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  console.log('Current auth user:', { user, error });
  
  if (!user) {
    console.error('❌ No authenticated user!');
  }
};
```

## Quick Fix: Update CircleChat Component

Add debugging and use simpler subscription approach.