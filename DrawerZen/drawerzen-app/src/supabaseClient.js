import { createClient } from '@supabase/supabase-js'
// Configuration with proper fallbacks and validation
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://dobvwnfsglqzdnsymzsp.supabase.co';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvYnZ3bmZzZ2xxemRuc3ltenNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NTQ2MDYsImV4cCI6MjA3MDUzMDYwNn0.5hAAfdqya9ggpIC2cUdCHrruNxEN4TMaMWuR0KhSdqs';
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase credentials not found in environment variables')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)