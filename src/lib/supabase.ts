import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oziqitfcquydsmzgxgsv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96aXFpdGZjcXV5ZHNtemd4Z3N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mjc5NzUsImV4cCI6MjA4OTUwMzk3NX0.aAJB33OUR3Jl4r1cU5zRG2RF8tUObokpoCmC42OiAvQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
