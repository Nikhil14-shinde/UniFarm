import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uvrukjqunduxalmybkat.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cnVranF1bmR1eGFsbXlia2F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMTc0NjEsImV4cCI6MjEwNDc5MzQ2MX0.IBdHlVtl8Z0GjqvP12ATwwpkedZn1FdEt1m5bKD71Rw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)