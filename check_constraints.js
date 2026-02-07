
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tywfdovkrfjoirdcdlxi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5d2Zkb3ZrcmZqb2lyZGNkbHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzEyNzksImV4cCI6MjA4NTcwNzI3OX0.qqkdcJ3uFX3Ji_p-AjbSwGXfk8PtSCLMyM8Jj2GKMP4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listConstraints() {
    console.log('Listing FK constraints on incidents table...');

    // We can't query information_schema directly with standard client usually, 
    // but we can try an RPC if available, or just use the error message 'hint' logic.
    // Actually, we can try to "discover" it by making a query that we know will fail 
    // and printing the full error which might list the relationship names.

    // Checking incidents -> classrooms
    const { error } = await supabase
        .from('incidents')
        .select('*, classrooms(*)')
        .limit(1);

    if (error) {
        console.log('❌ Error fetching with embedding:', error);
        if (error.details) console.log('Details:', error.details);
        if (error.hint) console.log('Hint:', error.hint);
    } else {
        console.log('✅ Query worked (unexpected if ambiguous).');
    }
}

listConstraints();
