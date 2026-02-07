
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tywfdovkrfjoirdcdlxi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5d2Zkb3ZrcmZqb2lyZGNkbHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzEyNzksImV4cCI6MjA4NTcwNzI3OX0.qqkdcJ3uFX3Ji_p-AjbSwGXfk8PtSCLMyM8Jj2GKMP4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
    console.log('Checking accessibility of profiles table...');

    // Try to select any profile
    const { data, error } = await supabase.from('profiles').select('*').limit(5);

    if (error) {
        console.log('❌ Error fetching profiles:', error.message);
        if (error.code === '42501') {
            console.log('   -> This is a PERMISSION DENIED error (RLS).');
        }
    } else {
        console.log(`✅ Successfully fetched ${data.length} profiles.`);
        if (data.length === 0) console.log('   (Table returned 0 rows, might be empty or RLS is hiding them)');
    }
}

checkProfiles();
