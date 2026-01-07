import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jsldrmudlqtwffwtrcwh.supabase.co';
const supabaseAnonKey = 'sb_publishable_O9G8dw66xC4qAxPOpCN3MA_yz5Fe0-w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
