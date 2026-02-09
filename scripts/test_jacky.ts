
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tywfdovkrfjoirdcdlxi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5d2Zkb3ZrcmZqb2lyZGNkbHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzEyNzksImV4cCI6MjA4NTcwNzI3OX0.qqkdcJ3uFX3Ji_p-AjbSwGXfk8PtSCLMyM8Jj2GKMP4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testJacky() {
    console.log('Testing login for miss.jacky@muivc.com with password password123');

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'miss.jacky@muivc.com',
        password: 'password123',
    });

    if (authError) {
        console.error('LOGIN FAILED:', authError.message);
        return;
    }

    console.log('LOGIN SUCCESSFUL!');
    const userId = authData.user.id;
    console.log('User ID:', userId);

    // Now test incident visibility
    const { count, error: countError } = await supabase
        .from('incidents')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error('Error fetching incidents:', countError.message);
    } else {
        console.log('Incidents visible for Jacky:', count);
    }

    // Verify they all belong to her
    const { data: incidents, error: fetchError } = await supabase
        .from('incidents')
        .select('teacher_id');

    if (fetchError) {
        console.error('Error fetching records:', fetchError.message);
    } else {
        const others = incidents?.filter(i => i.teacher_id !== userId);
        if (others && others.length > 0) {
            console.error('FAILURE: Detected incidents belonging to other teachers!', others.length);
        } else {
            console.log('SUCCESS: All visible incidents belong to the logged-in user.');
        }
    }
}

testJacky();
