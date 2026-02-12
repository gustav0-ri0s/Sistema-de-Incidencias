
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tywfdovkrfjoirdcdlxi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5d2Zkb3ZrcmZqb2lyZGNkbHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzEyNzksImV4cCI6MjA4NTcwNzI3OX0.qqkdcJ3uFX3Ji_p-AjbSwGXfk8PtSCLMyM8Jj2GKMP4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllTables() {
    // We can't query information_schema easily via anon key if RLS is tight
    // But we can try to query some standard tables to see if they exist
    const potentialTables = ['students', 'alumnos', 'enrollments', 'matriculas', 'classroom_students', 'profiles', 'incidents', 'classrooms'];

    for (const table of potentialTables) {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (!error || error.code !== '42P01') { // 42P01 is "relation does not exist"
            console.log(`✅ Table exists: ${table} (Code: ${error ? error.code : '200 OK'})`);
        } else {
            console.log(`❌ Table missing: ${table}`);
        }
    }
}

listAllTables();
