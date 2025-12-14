
-- Run this in Supabase SQL Editor to support Affiliate Links

-- 1. Add external_url column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS external_url TEXT;

-- 2. Update existing products with a placeholder (optional)
UPDATE public.products 
SET external_url = 'https://www.amazon.com' 
WHERE external_url IS NULL;
