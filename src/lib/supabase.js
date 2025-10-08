import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xnuzdzjfqhbpcnsetjif.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudXpkempmcWhicGNuc2V0amlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDExNzMsImV4cCI6MjA3NTA3NzE3M30.eE2cv8WArhcgl64P50B870OXMtLRCwXD5PKkiZQVU5s'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
