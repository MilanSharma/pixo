
-- 1. Create PROFILES table (Public profile info linked to Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  gender TEXT,
  interests TEXT[],
  followers_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create NOTES table (Posts/Reels)
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT,
  content TEXT,
  images TEXT[],
  category TEXT,
  location TEXT,
  product_tags TEXT[],
  likes_count INT DEFAULT 0,
  collects_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create MESSAGES table (Fixes your specific error)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE
);

-- 4. Create COMMENTS table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  note_id UUID REFERENCES public.notes(id) NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create LIKES table
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  note_id UUID REFERENCES public.notes(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, note_id)
);

-- 6. Create COLLECTS table
CREATE TABLE IF NOT EXISTS public.collects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  note_id UUID REFERENCES public.notes(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, note_id)
);

-- 7. Create FOLLOWS table
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES public.profiles(id) NOT NULL,
  following_id REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(follower_id, following_id)
);

-- 8. Create PRODUCTS table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  price NUMERIC,
  image TEXT,
  description TEXT,
  brand_name TEXT,
  brand_logo TEXT,
  in_stock BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Create Helper Functions (RPCs used in your code)
CREATE OR REPLACE FUNCTION increment_likes(note_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.notes SET likes_count = likes_count + 1 WHERE id = note_id;
  UPDATE public.profiles SET likes_count = likes_count + 1 WHERE id = (SELECT user_id FROM public.notes WHERE id = note_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_likes(note_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.notes SET likes_count = likes_count - 1 WHERE id = note_id;
  UPDATE public.profiles SET likes_count = likes_count - 1 WHERE id = (SELECT user_id FROM public.notes WHERE id = note_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_collects(note_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.notes SET collects_count = collects_count + 1 WHERE id = note_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_collects(note_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.notes SET collects_count = collects_count - 1 WHERE id = note_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Enable Row Level Security (Open for development, restrict for production)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Allow public access for now (Development Mode)
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Notes are viewable by everyone" ON public.notes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert notes" ON public.notes FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can see their own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
