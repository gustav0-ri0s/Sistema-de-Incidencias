
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tywfdovkrfjoirdcdlxi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5d2Zkb3ZrcmZqb2lyZGNkbHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzEyNzksImV4cCI6MjA4NTcwNzI3OX0.qqkdcJ3uFX3Ji_p-AjbSwGXfk8PtSCLMyM8Jj2GKMP4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    console.log('Listing tables in public schema...');
    try {
        // There isn't a direct "list tables" method in the JS client for the public API unless we use rpc or have permissions on information_schema.
        // However, we can try to guess or use a known generic query if an RPC exists, but usually it doesn't.
        // The user said "reporte_incidencias" database.
        // Let's try to infer from what we know or check if there IS a table named 'salones', 'classrooms', 'aulas', 'sections'.

        const candidates = ['salones', 'classrooms', 'aulas', 'sections', 'grades', 'grados', 'secciones'];

        for (const table of candidates) {
            const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
            if (!error) {
                console.log(`✅ Table '${table}' exists. Count: ${count}`);
                // If it exists, let's look at the columns of the first row
                const { data } = await supabase.from(table).select('*').limit(1);
                if (data && data.length > 0) {
                    console.log(`   Sample data for '${table}':`, data[0]);
                } else {
                    console.log(`   Table '${table}' is empty.`);
                }
            } else {
                console.log(`❌ Table '${table}' does not exist or is not accessible (Code: ${error.code})`);
            }
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

listTables();
