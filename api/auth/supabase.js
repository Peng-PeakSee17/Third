const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://wkgpyneafghqykiciyxg.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrZ3B5bmVhZmdocXlraWNpeXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjczNzEsImV4cCI6MjA5MTUwMzM3MX0.zTPkPVOzK-MtgaMAkdKS6gnKiI9OLJEMe0j1oUqRssw'
);

module.exports = supabase;
