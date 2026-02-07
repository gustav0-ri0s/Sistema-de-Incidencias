
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tywfdovkrfjoirdcdlxi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5d2Zkb3ZrcmZqb2lyZGNkbHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzEyNzksImV4cCI6MjA4NTcwNzI3OX0.qqkdcJ3uFX3Ji_p-AjbSwGXfk8PtSCLMyM8Jj2GKMP4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log('Inspecting schema...');

    try {
        // Check incidents columns
        const { data: incidents, error: incError } = await supabase.from('incidents').select('*').limit(1);
        if (incError) console.error('Error fetching incidents:', incError.message);
        else if (incidents.length > 0) console.log('✅ Sample Incident Keys:', Object.keys(incidents[0]));
        else console.log('⚠️ Incidents table empty, cannot infer columns from data.');

        // Check classrooms columns
        const { data: classrooms, error: classError } = await supabase.from('classrooms').select('*').limit(1);
        if (classError) console.error('Error fetching classrooms:', classError.message);
        else if (classrooms.length > 0) console.log('✅ Sample Classroom Keys:', Object.keys(classrooms[0]));
        else console.log('⚠️ Classrooms table empty.');

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

inspectSchema();
