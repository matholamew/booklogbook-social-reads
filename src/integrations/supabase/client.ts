
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://fabdzoyrghfjvxbgdgnm.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhYmR6b3lyZ2hmanZ4YmdkZ25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1OTAxNDIsImV4cCI6MjA2NjE2NjE0Mn0.o97nIIRbmF7RvXahFsnRgpguz9ANSa5BbwVcNDvLY0I"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
})

console.log('Supabase client initialized:', { supabaseUrl, hasKey: !!supabaseAnonKey })
