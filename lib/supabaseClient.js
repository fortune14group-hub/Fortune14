import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://updpywjfxeahtjpelbku.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwZHB5d2pmeGVhaHRqcGVsYmt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MjQzOTcsImV4cCI6MjA3MjUwMDM5N30.i1ztG8dkcHFLq8WEn_uVrgCBk0_Wf5gZb_OQQuaSGgo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
