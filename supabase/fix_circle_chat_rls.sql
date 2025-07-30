-- Fix missing INSERT policy for circle_chat_members table
-- This policy allows automatic insertion via the database trigger when users join circles

CREATE POLICY "Allow automatic insertion when users join circles" ON public.circle_chat_members
  FOR INSERT WITH CHECK (
    -- Allow insertion if the user is being added to a circle they're a member of
    EXISTS (
      SELECT 1 FROM public.circle_members cm
      WHERE cm.circle_id = circle_chat_members.circle_id
      AND cm.user_id = circle_chat_members.user_id
    )
  );

-- Also add a policy to allow users to manually join chat if needed
CREATE POLICY "Users can join chat for their circles" ON public.circle_chat_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.circle_members cm
      WHERE cm.circle_id = circle_chat_members.circle_id
      AND cm.user_id = auth.uid()
    )
  );