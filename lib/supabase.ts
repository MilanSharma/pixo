import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://euadfeuxhebnspdephoj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1YWRmZXV4aGVibnNwZGVwaG9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzOTgzMzcsImV4cCI6MjA4MDk3NDMzN30.lcbYOVWn2LSEDmem7QyUnxVgtyGU3cMp4TSFD67Bhso';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
