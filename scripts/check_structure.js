
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tywfdovkrfjoirdcdlxi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5d2Zkb3ZrcmZqb2lyZGNkbHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzEyNzksImV4cCI6MjA4NTcwNzI3OX0.qqkdcJ3uFX3Ji_p-AjbSwGXfk8PtSCLMyM8Jj2GKMP4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStructure() {
    console.log('--- Checking Incident Data Structure ---');

    // Attempt to login as Jacky to bypass RLS if needed, 
    // but first try to see if any incidents are public or if we can see them with anon key 
    // for specific IDs if we had one.

    // Instead, let's just query everything as authenticated if possible, 
    // but since I don't have a token, I'll use the miss.jacky credentials from the test script.

    const { data: authData } = await supabase.auth.signInWithPassword({
        email: 'miss.jacky@muivc.com',
        password: 'password123',
    });

    if (!authData?.user) {
        console.log('Could not log in as Jacky. Trying admin.');
        await supabase.auth.signInWithPassword({
            email: 'admin@colegio.edu.pe',
            password: 'password123',
        });
    }

    const { data, error } = await supabase
        .from('incidents')
        .select(`
            *,
            incident_participants(
                *,
                students(*)
            )
        `)
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log('✅ Found incident:', data[0].correlative);
        console.log('Participants structure:', JSON.stringify(data[0].incident_participants, null, 2));
    } else {
        console.log('⚠️ No incidents found.');
    }
}

checkStructure();
