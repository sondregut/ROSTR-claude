#!/usr/bin/env node

/**
 * Setup script to create missing chat tables and configure RLS policies
 * Run with: node scripts/setup-chat-tables.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupChatTables() {
  console.log('🏗️  Setting up chat tables and policies...\n');
  
  try {
    // 1. Add circle_id to messages table if not exists
    console.log('1. Adding circle_id to messages table...');
    await supabase.rpc('exec_sql', {
      query: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'messages' AND column_name = 'circle_id'
          ) THEN
            ALTER TABLE public.messages 
            ADD COLUMN circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE;
            
            ALTER TABLE public.messages
            ADD COLUMN sender_name TEXT,
            ADD COLUMN sender_avatar TEXT;
            
            CREATE INDEX IF NOT EXISTS idx_messages_circle_id ON public.messages(circle_id);
            CREATE INDEX IF NOT EXISTS idx_messages_circle_created ON public.messages(circle_id, created_at DESC);
          END IF;
        END $$;
      `
    });
    console.log('✅ Messages table updated');
    
    // 2. Create typing indicators table
    console.log('2. Creating typing indicators table...');
    await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS public.typing_indicators (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE NOT NULL,
          user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
          is_typing BOOLEAN DEFAULT FALSE,
          last_typed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(circle_id, user_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_typing_circle_user ON public.typing_indicators(circle_id, user_id);
      `
    });
    console.log('✅ Typing indicators table created');
    
    // 3. Create circle message reads table
    console.log('3. Creating circle message reads table...');
    await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS public.circle_message_reads (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE NOT NULL,
          user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
          last_read_message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
          last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(circle_id, user_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_circle_reads ON public.circle_message_reads(circle_id, user_id);
      `
    });
    console.log('✅ Circle message reads table created');
    
    // 4. Set up RLS policies for new tables
    console.log('4. Setting up RLS policies...');
    await supabase.rpc('exec_sql', {
      query: `
        -- Enable RLS
        ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.circle_message_reads ENABLE ROW LEVEL SECURITY;
        
        -- Typing indicators policies
        DROP POLICY IF EXISTS "Circle members can view typing indicators" ON public.typing_indicators;
        CREATE POLICY "Circle members can view typing indicators" ON public.typing_indicators
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM public.circle_members cm
              WHERE cm.circle_id = typing_indicators.circle_id
                AND cm.user_id = auth.uid()
            )
          );
        
        DROP POLICY IF EXISTS "Users can update their own typing status" ON public.typing_indicators;
        CREATE POLICY "Users can update their own typing status" ON public.typing_indicators
          FOR ALL USING (user_id = auth.uid());
        
        -- Circle message reads policies
        DROP POLICY IF EXISTS "Users can view and update their read status" ON public.circle_message_reads;
        CREATE POLICY "Users can view and update their read status" ON public.circle_message_reads
          FOR ALL USING (user_id = auth.uid());
        
        DROP POLICY IF EXISTS "Circle members can view others' read status" ON public.circle_message_reads;
        CREATE POLICY "Circle members can view others' read status" ON public.circle_message_reads
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM public.circle_members cm
              WHERE cm.circle_id = circle_message_reads.circle_id
                AND cm.user_id = auth.uid()
            )
          );
        
        -- Circle messages policies
        DROP POLICY IF EXISTS "Circle members can view circle messages" ON public.messages;
        CREATE POLICY "Circle members can view circle messages" ON public.messages
          FOR SELECT USING (
            circle_id IS NOT NULL AND
            EXISTS (
              SELECT 1 FROM public.circle_members cm
              WHERE cm.circle_id = messages.circle_id
                AND cm.user_id = auth.uid()
            )
          );
        
        DROP POLICY IF EXISTS "Circle members can send messages" ON public.messages;
        CREATE POLICY "Circle members can send messages" ON public.messages
          FOR INSERT WITH CHECK (
            circle_id IS NOT NULL AND
            sender_id = auth.uid() AND
            EXISTS (
              SELECT 1 FROM public.circle_members cm
              WHERE cm.circle_id = messages.circle_id
                AND cm.user_id = auth.uid()
            )
          );
      `
    });
    console.log('✅ RLS policies configured');
    
    // 5. Create helper function for unread count
    console.log('5. Creating helper functions...');
    await supabase.rpc('exec_sql', {
      query: `
        CREATE OR REPLACE FUNCTION get_circle_unread_count(p_circle_id UUID, p_user_id UUID)
        RETURNS INTEGER AS $$
        DECLARE
          v_last_read_id UUID;
          v_count INTEGER;
        BEGIN
          -- Get the last read message ID
          SELECT last_read_message_id INTO v_last_read_id
          FROM public.circle_message_reads
          WHERE circle_id = p_circle_id AND user_id = p_user_id;

          -- Count messages after the last read
          IF v_last_read_id IS NULL THEN
            -- User hasn't read any messages, count all
            SELECT COUNT(*) INTO v_count
            FROM public.messages
            WHERE circle_id = p_circle_id
              AND sender_id != p_user_id;
          ELSE
            -- Count messages after last read
            SELECT COUNT(*) INTO v_count
            FROM public.messages m1
            WHERE m1.circle_id = p_circle_id
              AND m1.sender_id != p_user_id
              AND m1.created_at > (
                SELECT created_at FROM public.messages
                WHERE id = v_last_read_id
              );
          END IF;

          RETURN COALESCE(v_count, 0);
        END;
        $$ LANGUAGE plpgsql;
        
        GRANT EXECUTE ON FUNCTION get_circle_unread_count TO authenticated;
      `
    });
    console.log('✅ Helper functions created');
    
    // 6. Enable realtime on messages table
    console.log('6. Enabling realtime on messages table...');
    await supabase.rpc('exec_sql', {
      query: `
        -- Enable realtime for messages
        ALTER TABLE public.messages REPLICA IDENTITY FULL;
        
        -- Enable realtime for typing indicators  
        ALTER TABLE public.typing_indicators REPLICA IDENTITY FULL;
      `
    });
    console.log('✅ Realtime enabled');
    
    console.log('\n🎉 Chat setup complete! The following tables are now ready:');
    console.log('   - messages (with circle_id support)');
    console.log('   - typing_indicators');
    console.log('   - circle_message_reads');
    console.log('   - All RLS policies configured');
    console.log('   - Realtime enabled');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n💡 Manual setup required:');
    console.log('1. Go to Supabase SQL Editor');
    console.log('2. Run the contents of supabase/circle_chat_schema.sql');
    console.log('3. Enable Realtime on messages and typing_indicators tables');
  }
}

setupChatTables().then(() => {
  console.log('\n✅ Setup complete! You can now test chat functionality.');
  process.exit(0);
}).catch(console.error);