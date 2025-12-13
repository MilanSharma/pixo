-- Run this in Supabase SQL Editor to allow users to delete their own notes
CREATE POLICY "Users can delete own notes" 
ON public.notes 
FOR DELETE 
USING (auth.uid() = user_id);
