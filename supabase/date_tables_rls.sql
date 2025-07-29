-- RLS policies for date planning tables
-- Execute this AFTER running date_tables_additions.sql

-- Enable RLS on new tables
ALTER TABLE public.date_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.date_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.date_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Date plans policies
CREATE POLICY "Users can view their own date plans" ON public.date_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own date plans" ON public.date_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own date plans" ON public.date_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own date plans" ON public.date_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Date likes policies (updated table name)
CREATE POLICY "Users can view likes on visible date entries" ON public.date_likes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.date_entries de
      WHERE de.id = date_entry_id
      AND (
        de.is_private = false OR 
        de.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.circle_members cm
          WHERE cm.user_id = auth.uid()
          AND cm.circle_id = ANY(de.shared_circles)
        )
      )
    )
  );

CREATE POLICY "Users can like date entries" ON public.date_likes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.date_entries de
      WHERE de.id = date_entry_id
      AND (
        de.is_private = false OR 
        de.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.circle_members cm
          WHERE cm.user_id = auth.uid()
          AND cm.circle_id = ANY(de.shared_circles)
        )
      )
    )
  );

CREATE POLICY "Users can unlike date entries" ON public.date_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Date comments policies (updated table name)
CREATE POLICY "Users can view comments on visible date entries" ON public.date_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.date_entries de
      WHERE de.id = date_entry_id
      AND (
        de.is_private = false OR 
        de.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.circle_members cm
          WHERE cm.user_id = auth.uid()
          AND cm.circle_id = ANY(de.shared_circles)
        )
      )
    )
  );

CREATE POLICY "Users can comment on date entries" ON public.date_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.date_entries de
      WHERE de.id = date_entry_id
      AND (
        de.is_private = false OR 
        de.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.circle_members cm
          WHERE cm.user_id = auth.uid()
          AND cm.circle_id = ANY(de.shared_circles)
        )
      )
    )
  );

CREATE POLICY "Users can update their own comments" ON public.date_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.date_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Plan likes policies
CREATE POLICY "Users can view plan likes" ON public.plan_likes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.date_plans dp
      WHERE dp.id = date_plan_id
      AND dp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can like plans" ON public.plan_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike plans" ON public.plan_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Plan comments policies
CREATE POLICY "Users can view plan comments" ON public.plan_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.date_plans dp
      WHERE dp.id = date_plan_id
      AND dp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can comment on plans" ON public.plan_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plan comments" ON public.plan_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plan comments" ON public.plan_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Poll votes policies
CREATE POLICY "Users can view poll votes on visible date entries" ON public.poll_votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.date_entries de
      WHERE de.id = date_entry_id
      AND (
        de.is_private = false OR 
        de.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.circle_members cm
          WHERE cm.user_id = auth.uid()
          AND cm.circle_id = ANY(de.shared_circles)
        )
      )
    )
  );

CREATE POLICY "Users can vote on polls" ON public.poll_votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.date_entries de
      WHERE de.id = date_entry_id
      AND (
        de.is_private = false OR 
        de.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.circle_members cm
          WHERE cm.user_id = auth.uid()
          AND cm.circle_id = ANY(de.shared_circles)
        )
      )
    )
  );

CREATE POLICY "Users can update their own votes" ON public.poll_votes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON public.poll_votes
  FOR DELETE USING (auth.uid() = user_id);