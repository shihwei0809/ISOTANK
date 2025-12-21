import { createClient } from '@supabase/supabase-js';

// 🔴 請把這裡換成你在 Supabase Settings > API 頁面看到的內容
const SUPABASE_URL = 'https://ywyugrzwqablkvkkstgz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_9N-k44VYTiK7BOqQN1PtCA_RAmHntWv';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);