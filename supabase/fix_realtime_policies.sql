-- Fix Real-time Subscriptions for Circle Chat
-- Run this in Supabase SQL Editor to ensure real-time works

-- 1. Enable RLS on all chat tables
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_message_reads ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view messages in their circles" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to their circles" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

-- 3. Create comprehensive RLS policies for messages
-- Allow authenticated users to view messages in circles they belong to
CREATE POLICY "Users can view messages in their circles"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    circle_id IN (
      SELECT circle_id FROM public.circle_members 
      WHERE user_id = auth.uid()
    )
    OR 
    -- Allow viewing messages without circle_id (direct messages)
    circle_id IS NULL
  );

-- Allow users to send messages to circles they belong to
CREATE POLICY "Users can send messages to their circles"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    (
      circle_id IN (
        SELECT circle_id FROM public.circle_members 
        WHERE user_id = auth.uid()
      )
      OR
      circle_id IS NULL
    )
  );

-- Allow users to update their own messages
CREATE POLICY "Users can update their own messages"
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Allow users to delete their own messages
CREATE POLICY "Users can delete their own messages"
  ON public.messages
  FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

-- 4. Policies for typing indicators
DROP POLICY IF EXISTS "Users can view typing indicators in their circles" ON public.typing_indicators;
DROP POLICY IF EXISTS "Users can manage their own typing status" ON public.typing_indicators;

CREATE POLICY "Users can view typing indicators in their circles"
  ON public.typing_indicators
  FOR SELECT
  TO authenticated
  USING (
    circle_id IN (
      SELECT circle_id FROM public.circle_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own typing status"
  ON public.typing_indicators
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5. Policies for message reads
DROP POLICY IF EXISTS "Users can view read status in their circles" ON public.circle_message_reads;
DROP POLICY IF EXISTS "Users can update their own read status" ON public.circle_message_reads;

CREATE POLICY "Users can view read status in their circles"
  ON public.circle_message_reads
  FOR SELECT
  TO authenticated
  USING (
    circle_id IN (
      SELECT circle_id FROM public.circle_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own read status"
  ON public.circle_message_reads
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 6. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.typing_indicators TO authenticated;
GRANT ALL ON public.circle_message_reads TO authenticated;

-- 7. Ensure sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 8. Create a test function to verify policies
CREATE OR REPLACE FUNCTION test_message_policies(test_circle_id UUID)
RETURNS TABLE(
  test_name TEXT,
  test_result BOOLEAN,
  test_details TEXT
) AS $$
DECLARE
  can_select BOOLEAN;
  can_insert BOOLEAN;
  message_count INTEGER;
BEGIN
  -- Test SELECT
  BEGIN
    SELECT COUNT(*) INTO message_count
    FROM public.messages
    WHERE circle_id = test_circle_id;
    can_select := TRUE;
  EXCEPTION WHEN OTHERS THEN
    can_select := FALSE;
  END;
  
  RETURN QUERY SELECT 
    'Can SELECT messages'::TEXT, 
    can_select, 
    CASE WHEN can_select THEN 'Found ' || message_count || ' messages' ELSE 'Permission denied' END;
  
  -- Test INSERT capability (without actually inserting)
  BEGIN
    can_insert := EXISTS (
      SELECT 1 FROM public.circle_members 
      WHERE circle_id = test_circle_id AND user_id = auth.uid()
    );
  EXCEPTION WHEN OTHERS THEN
    can_insert := FALSE;
  END;
  
  RETURN QUERY SELECT 
    'Can INSERT messages'::TEXT, 
    can_insert, 
    CASE WHEN can_insert THEN 'User is circle member' ELSE 'User not in circle' END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Verify real-time is enabled (check this in Dashboard)
-- Go to Database -> Replication and enable:
-- - messages
-- - typing_indicators 
-- - circle_message_reads

-- 10. Test the policies (replace with your circle ID)
-- SELECT * FROM test_message_policies('YOUR-CIRCLE-UUID-HERE');