# Circle Group Chat Setup Guide

## Overview
The circle group chat feature allows members of a circle to communicate in real-time through a group messaging interface. This guide explains how to set up and use the feature.

## Database Setup

### 1. Run the Schema Updates
Execute the SQL script in your Supabase SQL Editor:

```bash
# Navigate to Supabase Dashboard > SQL Editor
# Copy and paste the contents of:
supabase/circle_chat_schema.sql
```

This will:
- Add `circle_id` column to messages table
- Create typing indicators table
- Create message read tracking table
- Set up necessary indexes and RLS policies
- Create helper functions for unread counts

### 2. Enable Realtime
In Supabase Dashboard:
1. Go to Database > Replication
2. Enable replication for:
   - `messages` table
   - `typing_indicators` table
   - `circle_message_reads` table

## Feature Overview

### Components Created

1. **CircleChatService** (`services/supabase/circleChat.ts`)
   - Handles all backend communication
   - Real-time message subscriptions
   - Typing indicators
   - Message CRUD operations

2. **Chat UI Components** (`components/ui/chat/`)
   - `CircleChat.tsx` - Main chat container
   - `MessageBubble.tsx` - Individual message display
   - `MessageInput.tsx` - Text input with send button
   - `TypingIndicator.tsx` - Animated typing indicators

3. **Circle Detail Integration** (`app/circles/[id].tsx`)
   - Added "Chat" tab to circle detail screen
   - Shows unread message count badge
   - Integrated with existing circle navigation

## Usage

### For Users

1. **Access Chat**
   - Navigate to Circles tab
   - Select a circle
   - Tap on "Chat" tab

2. **Send Messages**
   - Type message in input field
   - Tap send button or press Enter
   - Character limit: 500 characters

3. **Features**
   - Real-time message delivery
   - Typing indicators ("Sarah is typing...")
   - Message timestamps
   - System messages for events
   - Long press to delete own messages

### For Developers

#### Send a Message
```typescript
import { CircleChatService } from '@/services/supabase/circleChat';

await CircleChatService.sendCircleMessage(
  circleId,
  senderId,
  senderName,
  senderAvatar,
  content,
  'text' // or 'image', 'system'
);
```

#### Subscribe to Messages
```typescript
const unsubscribe = CircleChatService.subscribeToCircleMessages(
  circleId,
  (newMessage) => {
    // Handle new message
  }
);

// Clean up
unsubscribe();
```

#### Get Unread Count
```typescript
const count = await CircleChatService.getCircleUnreadCount(circleId, userId);
```

## Testing

### Test Checklist
- [ ] Messages send and appear in real-time
- [ ] Typing indicators show for other users
- [ ] Messages persist after app restart
- [ ] Unread count updates correctly
- [ ] Can delete own messages
- [ ] System messages display properly
- [ ] Scroll to bottom on new messages
- [ ] Character limit enforced

### Mock Data
The current implementation includes mock user data for testing:
```typescript
const currentUser = {
  id: '1',
  name: 'Sarah Chen',
  avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
};
```

Replace this with actual auth context in production.

## Integration with Auth

To integrate with your authentication system:

1. Replace mock `currentUser` with actual auth data:
```typescript
import { useAuth } from '@/contexts/AuthContext';

const { user } = useAuth();
const currentUser = {
  id: user.id,
  name: user.name,
  avatar: user.image_uri
};
```

2. Add permission checks in `CircleChat` component
3. Handle unauthorized access appropriately

## Future Enhancements

### Planned Features
- [ ] Image/media messages
- [ ] Message reactions
- [ ] Reply to specific messages
- [ ] Message search
- [ ] Push notifications
- [ ] Voice messages
- [ ] @mentions
- [ ] Read receipts ("Seen by...")

### Performance Optimizations
- [ ] Message pagination (currently loads last 50)
- [ ] Local message caching
- [ ] Optimistic UI updates
- [ ] Background message sync

## Troubleshooting

### Messages Not Appearing
1. Check Supabase realtime is enabled
2. Verify RLS policies are correct
3. Check browser console for errors
4. Ensure user is a circle member

### Typing Indicators Not Working
1. Check `typing_indicators` table exists
2. Verify realtime is enabled for the table
3. Check network connectivity

### High Database Usage
1. Implement message pagination
2. Add cleanup for old typing indicators
3. Archive old messages periodically

## Security Considerations

1. **RLS Policies**: Only circle members can read/send messages
2. **Message Deletion**: Users can only delete their own messages
3. **Input Validation**: Character limits and content sanitization
4. **Rate Limiting**: Consider adding rate limits for message sending

## Support

For issues or questions:
1. Check error logs in Supabase Dashboard
2. Review browser console for client-side errors
3. Verify all database migrations ran successfully
4. Ensure proper environment variables are set