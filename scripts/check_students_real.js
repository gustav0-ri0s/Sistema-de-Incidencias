
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tywfdovkrfjoirdcdlxi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5d2Zkb3ZrcmZqb2lyZGNkbHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzEyNzksImV4cCI6MjA4NTcwNzI3OX0.qqkdcJ3uFX3Ji_p-AjbSwGXfk8PtSCLMyM8Jj2GKMP4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStudentColumns() {
    console.log('--- Checking Students Table ---');

    // Attempt 1: Just get one row and check keys
    const { data, error } = await supabase.from('students').select('*').limit(1);

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log('✅ Found a student! Columns:', Object.keys(data[0]));
        console.log('Data:', data[0]);
    } else {
        console.log('⚠️ No students found in the table.');
        // Attempt 2: Check if table even exists/accessible by trying to count
        const { count, error: countError } = await supabase.from('students').select('*', { count: 'exact', head: true });
        if (countError) {
            console.error('❌ Table might not exist or no access:', countError.message);
        } else {
            console.log('✅ Table exists and has', count, 'rows (but RLS might be hiding them if 0)');
        }
    }
}

checkStudentColumns();
