import { createClient } from '@supabase/supabase-js';

// 🔴 請把這裡換成你在 Supabase Settings > API 頁面看到的內容
const SUPABASE_URL = 'https://ygadiauwesfalftfbxxg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_BMrzTZJ6WVYJyKPLlgnDXA_dGsh0L8y';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);