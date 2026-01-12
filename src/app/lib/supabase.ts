import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jsldrmudlqtwffwtrcwh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzbGRybXVkbHF0d2Zmd3RyY3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MDEwNDIsImV4cCI6MjA4MzM3NzA0Mn0.T5YIhRCO563hTHtn17xXxPz88TEoLyZI01yfYgQ3Pa0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
