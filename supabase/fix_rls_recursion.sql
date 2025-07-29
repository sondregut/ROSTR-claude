-- Fix RLS Recursion Issues
-- Run this to fix any remaining recursion problems

-- Drop problematic policies if they still exist
DROP POLICY IF EXISTS "Users can view circle memberships" ON public.circle_members;
DROP POLICY IF EXISTS "Circle owners and admins can manage members" ON public.circle_members;

-- The corrected policies should already be in place from the edited rls_policies.sql
-- This file is just for cleanup if needed