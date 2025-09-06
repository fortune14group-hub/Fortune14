// /api/_supabaseAdmin.js (CommonJS)
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

module.exports = { supabaseAdmin };
