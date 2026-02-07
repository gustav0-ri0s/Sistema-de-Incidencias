
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tywfdovkrfjoirdcdlxi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5d2Zkb3ZrcmZqb2lyZGNkbHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzEyNzksImV4cCI6MjA4NTcwNzI3OX0.qqkdcJ3uFX3Ji_p-AjbSwGXfk8PtSCLMyM8Jj2GKMP4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkClassrooms() {
    console.log('Checking accessibility of classrooms table...');

    const { data, error } = await supabase.from('classrooms').select('*').limit(5);

    if (error) {
        console.log('❌ Error fetching classrooms:', error.message);
    } else {
        console.log(`✅ Successfully fetched ${data.length} classrooms.`);
        if (data.length === 0) console.log('   (Table returned 0 rows, might be empty or RLS is hiding them)');
    }
}

checkClassrooms();
