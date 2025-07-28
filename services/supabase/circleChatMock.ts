// Mock implementation for testing when database is not set up
import { CircleMessageWithSender, TypingUser } from './circleChat';

export class CircleChatMockService {
  private static messages: CircleMessageWithSender[] = [
    {
      id: '1',
      circle_id: '1',
      sender_id: 'system',
      sender_name: 'System',
      sender_avatar: '',
      content: 'Welcome to Besties chat! 👋',
      message_type: 'system',
      is_read: true,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '2',
      circle_id: '1',
      sender_id: '2',
      sender_name: 'Mike Johnson',
      sender_avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      content: 'Hey everyone! How\'s it going?',
      message_type: 'text',
      is_read: true,
      created_at: new Date(Date.now() - 1800000).toISOString(),
      updated_at: new Date(Date.now() - 1800000).toISOString(),
      sender: {
        id: '2',
        name: 'Mike Johnson',
        username: 'mikej',
        image_uri: 'https://randomuser.me/api/portraits/men/32.jpg',
      }
    },
    {
      id: '3',
      circle_id: '1',
      sender_id: '3',
      sender_name: 'Emma Wilson',
      sender_avatar: 'https://randomuser.me/api/portraits/women/22.jpg',
      content: 'Just had an amazing date! Can\'t wait to tell you all about it 💕',
      message_type: 'text',
      is_read: true,
      created_at: new Date(Date.now() - 900000).toISOString(),
      updated_at: new Date(Date.now() - 900000).toISOString(),
      sender: {
        id: '3',
        name: 'Emma Wilson',
        username: 'emmaw',
        image_uri: 'https://randomuser.me/api/portraits/women/22.jpg',
      }
    },
  ];

  private static messageCallbacks: Map<string, (message: CircleMessageWithSender) => void> = new Map();
  private static typingCallbacks: Map<string, (users: TypingUser[]) => void> = new Map();
  private static typingUsers: Map<string, TypingUser[]> = new Map();

  static async sendCircleMessage(
    circleId: string,
    senderId: string,
    senderName: string,
    senderAvatar: string,
    content: string,
    messageType: 'text' | 'image' | 'system' = 'text'
  ): Promise<CircleMessageWithSender> {
    const newMessage: CircleMessageWithSender = {
      id: Date.now().toString(),
      circle_id: circleId,
      sender_id: senderId,
      sender_name: senderName,
      sender_avatar: senderAvatar,
      content,
      message_type: messageType,
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: {
        id: senderId,
        name: senderName,
        username: senderName.toLowerCase().replace(' ', ''),
        image_uri: senderAvatar,
      }
    };

    this.messages.push(newMessage);

    // Notify subscribers
    const callback = this.messageCallbacks.get(circleId);
    if (callback) {
      setTimeout(() => callback(newMessage), 100);
    }

    // Simulate response from other users (30% chance)
    if (Math.random() < 0.3 && senderId !== '2' && senderId !== '3') {
      setTimeout(() => {
        this.simulateResponse(circleId);
      }, 2000);
    }

    return newMessage;
  }

  static async getCircleMessages(circleId: string): Promise<CircleMessageWithSender[]> {
    console.log('📱 Using mock messages for circle', circleId);
    return this.messages.filter(m => m.circle_id === circleId);
  }

  static subscribeToCircleMessages(
    circleId: string,
    onMessage: (message: CircleMessageWithSender) => void
  ): () => void {
    console.log('📱 Mock subscription active for circle', circleId);
    this.messageCallbacks.set(circleId, onMessage);
    
    return () => {
      this.messageCallbacks.delete(circleId);
    };
  }

  static async markCircleMessagesAsRead(
    circleId: string,
    userId: string,
    lastMessageId: string
  ): Promise<void> {
    // Mock implementation
    console.log('✅ Marked messages as read');
  }

  static async setTypingStatus(
    circleId: string,
    userId: string,
    isTyping: boolean
  ): Promise<void> {
    // Mock implementation
    console.log(`⌨️ ${isTyping ? 'Started' : 'Stopped'} typing`);
  }

  static subscribeToCircleTyping(
    circleId: string,
    currentUserId: string,
    onTypingChange: (users: TypingUser[]) => void
  ): () => void {
    this.typingCallbacks.set(circleId, onTypingChange);
    
    return () => {
      this.typingCallbacks.delete(circleId);
    };
  }

  static async deleteMessage(messageId: string, userId: string): Promise<void> {
    const index = this.messages.findIndex(m => m.id === messageId && m.sender_id === userId);
    if (index !== -1) {
      this.messages.splice(index, 1);
    }
  }

  private static simulateResponse(circleId: string) {
    const responses = [
      { id: '2', name: 'Mike Johnson', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', messages: [
        "That's awesome! Tell us more!",
        "Can't wait to hear about it!",
        "So happy for you! 🎉",
      ]},
      { id: '3', name: 'Emma Wilson', avatar: 'https://randomuser.me/api/portraits/women/22.jpg', messages: [
        "Yay! Details please! 💕",
        "This is so exciting!",
        "We need all the tea! ☕",
      ]},
    ];

    const responder = responses[Math.floor(Math.random() * responses.length)];
    const message = responder.messages[Math.floor(Math.random() * responder.messages.length)];

    this.sendCircleMessage(
      circleId,
      responder.id,
      responder.name,
      responder.avatar,
      message,
      'text'
    );
  }
}