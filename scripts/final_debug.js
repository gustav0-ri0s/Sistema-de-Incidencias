
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tywfdovkrfjoirdcdlxi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5d2Zkb3ZrcmZqb2lyZGNkbHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzEyNzksImV4cCI6MjA4NTcwNzI3OX0.qqkdcJ3uFX3Ji_p-AjbSwGXfk8PtSCLMyM8Jj2GKMP4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function finalDebug() {
    console.log('--- FINAL DEBUG ---');
    // Try both schemas
    const { data: d1, error: e1 } = await supabase.from('students').select('names, last_names').limit(1);
    const { data: d2, error: e2 } = await supabase.from('students').select('first_name, last_name').limit(1);

    if (e1) console.log('Names/LastNames schema error:', e1.message);
    else console.log('Names/LastNames schema exists!');

    if (e2) console.log('FirstName/LastName schema error:', e2.message);
    else console.log('FirstName/LastName schema exists!');

    // Show data if any
    const { data: all } = await supabase.from('students').select('*').limit(5);
    console.log('Data sample:', JSON.stringify(all, null, 2));
}

finalDebug();
