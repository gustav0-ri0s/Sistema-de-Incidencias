
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tywfdovkrfjoirdcdlxi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5d2Zkb3ZrcmZqb2lyZGNkbHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzEyNzksImV4cCI6MjA4NTcwNzI3OX0.qqkdcJ3uFX3Ji_p-AjbSwGXfk8PtSCLMyM8Jj2GKMP4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugReportData() {
    console.log('--- Debugging Report Search ---');

    // 1. Get all incidents with participants
    const { data: incidents, error } = await supabase
        .from('incidents')
        .select(`
            id,
            correlative,
            incident_date,
            involved_students,
            incident_participants(
                id,
                student_id,
                students(id, first_name, last_name)
            )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('❌ Error fetching incidents:', error.message);
        return;
    }

    console.log(`✅ Fetched ${incidents.length} recent incidents.`);

    incidents.forEach(inc => {
        console.log(`\nIncident ${inc.correlative} (${inc.id}):`);
        console.log(`- Participants (from JOIN):`, JSON.stringify(inc.incident_participants, null, 2));
        console.log(`- Involved Students (JSONB):`, JSON.stringify(inc.involved_students, null, 2));
    });

    // 2. Check if there are any students with incidents recently
    const studentSearch = ''; // Test with empty search first
    console.log('\n--- End of Debug ---');
}

debugReportData();
