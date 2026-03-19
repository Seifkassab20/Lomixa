import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use placeholder values when Supabase is not configured so the app runs in demo mode
const url = supabaseUrl || 'https://placeholder.supabase.co';
const key = supabaseAnonKey || 'placeholder-anon-key-for-demo-mode';

export const supabase = createClient(url, key);
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
