
-- ENABLE PRODUCT CREATION FOR USERS
-- Run this in Supabase SQL Editor

-- 1. Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2. Allow authenticated users to insert products
DROP POLICY IF EXISTS "Users can create products" ON public.products;
CREATE POLICY "Users can create products" 
ON public.products FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 3. Allow everyone to view products
DROP POLICY IF EXISTS "Everyone can view products" ON public.products;
CREATE POLICY "Everyone can view products" 
ON public.products FOR SELECT 
USING (true);
