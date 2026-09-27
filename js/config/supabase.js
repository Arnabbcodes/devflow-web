
export const DEFAULT_SUPABASE_URL = "YOUR_SUPABASE_URL";
export const DEFAULT_SUPABASE_KEY = "YOUR_PUBLISHABLE_KEY";

const storedConfig = localStorage.getItem('devflow_supabase_config');
let userConfig = null;
try {
  userConfig = storedConfig ? JSON.parse(storedConfig) : null;
} catch (e) {
  userConfig = null;
}

export const SUPABASE_URL = (userConfig && userConfig.url && userConfig.url !== 'YOUR_SUPABASE_URL') 
  ? userConfig.url 
  : DEFAULT_SUPABASE_URL;

export const SUPABASE_KEY = (userConfig && userConfig.key && userConfig.key !== 'YOUR_PUBLISHABLE_KEY') 
  ? userConfig.key 
  : DEFAULT_SUPABASE_KEY;

export function isSupabaseConfigured() {
  return SUPABASE_URL && 
         SUPABASE_KEY && 
         SUPABASE_URL !== "YOUR_SUPABASE_URL" && 
         SUPABASE_KEY !== "YOUR_PUBLISHABLE_KEY" &&
         SUPABASE_URL.startsWith('http');
}

let client = null;

if (isSupabaseConfigured()) {
  if (typeof window !== 'undefined' && window.supabase) {
    try {
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } catch (err) {
      console.warn("Failed to initialize Supabase client:", err);
    }
  }
}

export const supabaseClient = client;

export function saveSupabaseConfig(url, key) {
  localStorage.setItem('devflow_supabase_config', JSON.stringify({ url: url.trim(), key: key.trim() }));
  window.location.reload();
}

export function clearSupabaseConfig() {
  localStorage.removeItem('devflow_supabase_config');
  window.location.reload();
}
