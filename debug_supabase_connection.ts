
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  console.log('--- Testing Public Table Access ---')
  const { count, error: tableError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  if (tableError) {
    console.error('Table Error:', tableError)
  } else {
    console.log('Profiles Table Access: OK (Count:', count, ')')
  }

  console.log('\n--- Testing Login ---')
  const { data, error: authError } = await supabase.auth.signInWithPassword({
    email: 'rustylindquist@gmail.com',
    password: 'Ongofu.com123'
  })

  if (authError) {
    console.error('Auth Error:', authError)
  } else {
    console.log('Login Success:', data.user?.email)
  }
}

test()
