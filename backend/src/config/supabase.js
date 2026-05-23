const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || "https://utzqselxhjgygyvgqyef.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0enFzZWx4aGpneWd5dmdxeWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MjU2NjQsImV4cCI6MjA5NTEwMTY2NH0.DKYq1eEYq10g3hMDXT83Sbuj_p-oTi95_OuQhhBaepA";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function supa(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

module.exports = { supabase, supa };
