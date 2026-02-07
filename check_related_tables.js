
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tywfdovkrfjoirdcdlxi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5d2Zkb3ZrcmZqb2lyZGNkbHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzEyNzksImV4cCI6MjA4NTcwNzI3OX0.qqkdcJ3uFX3Ji_p-AjbSwGXfk8PtSCLMyM8Jj2GKMP4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRelatedTables() {
    console.log('Checking students and participants...');

    // Check students
    const { data: students, error: sError } = await supabase.from('students').select('*').limit(5);
    if (sError) console.log('❌ Error fetching students:', sError.message, sError.code);
    else console.log(`✅ Fetched ${students.length} students.`);

    // Check participants
    const { data: parts, error: pError } = await supabase.from('incident_participants').select('*').limit(5);
    if (pError) console.log('❌ Error fetching participants:', pError.message, pError.code);
    else console.log(`✅ Fetched ${parts.length} participants.`);

}

checkRelatedTables();
