-- Fix Circle Message Reads Foreign Key Constraints
-- This migration addresses the foreign key constraint issues in circle_message_reads

-- Step 1: Drop the existing foreign key constraint if it exists
DO $$ 
BEGIN
    -- Check if the constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'circle_message_reads_last_read_message_id_fkey'
        AND table_name = 'circle_message_reads'
    ) THEN
        ALTER TABLE public.circle_message_reads 
        DROP CONSTRAINT circle_message_reads_last_read_message_id_fkey;
        RAISE NOTICE 'Dropped existing foreign key constraint';
    END IF;
END $$;

-- Step 2: Clean up any invalid references that might exist
UPDATE public.circle_message_reads 
SET last_read_message_id = NULL 
WHERE last_read_message_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.messages 
    WHERE id = circle_message_reads.last_read_message_id
  );

-- Step 3: Create a more flexible foreign key constraint with SET NULL on delete
-- This prevents the constraint violation when messages are deleted
ALTER TABLE public.circle_message_reads 
ADD CONSTRAINT circle_message_reads_last_read_message_id_fkey 
FOREIGN KEY (last_read_message_id) 
REFERENCES public.messages(id) 
ON DELETE SET NULL;

-- Step 4: Create an index to improve performance for read tracking queries
CREATE INDEX IF NOT EXISTS idx_circle_message_reads_message_id 
ON public.circle_message_reads(last_read_message_id) 
WHERE last_read_message_id IS NOT NULL;

-- Step 5: Create a helper function to safely mark messages as read
CREATE OR REPLACE FUNCTION safe_mark_circle_messages_read(
    p_circle_id UUID,
    p_user_id UUID,
    p_last_message_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_message_exists BOOLEAN := FALSE;
BEGIN
    -- Check if message exists (only if provided)
    IF p_last_message_id IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM public.messages 
            WHERE id = p_last_message_id
        ) INTO v_message_exists;
        
        -- If message doesn't exist, set to null
        IF NOT v_message_exists THEN
            p_last_message_id := NULL;
        END IF;
    END IF;
    
    -- Upsert the read status
    INSERT INTO public.circle_message_reads (
        circle_id, 
        user_id, 
        last_read_message_id, 
        last_read_at
    ) VALUES (
        p_circle_id, 
        p_user_id, 
        p_last_message_id, 
        NOW()
    )
    ON CONFLICT (circle_id, user_id) 
    DO UPDATE SET 
        last_read_message_id = EXCLUDED.last_read_message_id,
        last_read_at = EXCLUDED.last_read_at;
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail
    RAISE WARNING 'Failed to mark messages as read for circle % user %: %', 
        p_circle_id, p_user_id, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION safe_mark_circle_messages_read TO authenticated;

-- Step 6: Update the existing unread count function to handle NULL message IDs
CREATE OR REPLACE FUNCTION get_circle_unread_count(p_circle_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_last_read_id UUID;
    v_last_read_at TIMESTAMP WITH TIME ZONE;
    v_count INTEGER;
BEGIN
    -- Get the last read message ID and timestamp
    SELECT last_read_message_id, last_read_at 
    INTO v_last_read_id, v_last_read_at
    FROM public.circle_message_reads
    WHERE circle_id = p_circle_id AND user_id = p_user_id;

    -- Count messages after the last read
    IF v_last_read_id IS NULL AND v_last_read_at IS NULL THEN
        -- User hasn't read any messages, count all
        SELECT COUNT(*) INTO v_count
        FROM public.messages
        WHERE circle_id = p_circle_id
          AND sender_id != p_user_id;
    ELSIF v_last_read_id IS NOT NULL THEN
        -- Count messages after last read message
        SELECT COUNT(*) INTO v_count
        FROM public.messages m1
        WHERE m1.circle_id = p_circle_id
          AND m1.sender_id != p_user_id
          AND m1.created_at > (
            SELECT created_at FROM public.messages
            WHERE id = v_last_read_id
          );
    ELSE
        -- Use timestamp if message ID is null
        SELECT COUNT(*) INTO v_count
        FROM public.messages
        WHERE circle_id = p_circle_id
          AND sender_id != p_user_id
          AND created_at > v_last_read_at;
    END IF;

    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Add a comment explaining the changes
COMMENT ON FUNCTION safe_mark_circle_messages_read IS 
'Safely marks circle messages as read, handling cases where the referenced message may not exist';

COMMENT ON FUNCTION get_circle_unread_count IS 
'Gets unread message count for a user in a circle, handling both message ID and timestamp-based tracking';