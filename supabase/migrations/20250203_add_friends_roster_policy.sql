-- Add RLS policy to allow friends to view each other's roster entries
-- This allows friends to see each other's dating rosters in their profiles

CREATE POLICY "Friends can view each other's roster entries" ON public.roster_entries
    FOR SELECT USING (
        auth.uid() = user_id OR 
        are_friends(auth.uid(), user_id)
    );