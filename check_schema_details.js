
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

        // Check students columns
        const { data: students, error: studError } = await supabase.from('students').select('*').limit(1);
        if (studError) {
            console.error('Error fetching students:', studError.message);
        } else {
            console.log('✅ Students table accessible.');
            if (students.length > 0) {
                console.log('✅ Sample Student Keys:', Object.keys(students[0]));
            } else {
                console.log('⚠️ Students table empty. Attempting to infer columns from schema...');
                // Query information_schema to get column names even if table is empty
                const { data: columns, error: colError } = await supabase
                    .from('information_schema.columns')
                    .select('column_name')
                    .eq('table_schema', 'public') // Assuming 'public' schema
                    .eq('table_name', 'students')
                    .order('ordinal_position', { ascending: true });

                if (colError) {
                    console.error('Error fetching student table schema:', colError.message);
                } else if (columns.length > 0) {
                    console.log('✅ Student Table Columns (from schema):', columns.map(col => col.column_name));
                } else {
                    console.log('❌ Could not infer student table columns from schema.');
                }
            }
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

inspectSchema();
