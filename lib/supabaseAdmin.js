import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseServiceRole) {
  throw new Error('SUPABASE_URL och SUPABASE_SERVICE_ROLE måste vara satta för admin-klienten.');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);
