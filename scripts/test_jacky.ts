
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tywfdovkrfjoirdcdlxi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5d2Zkb3ZrcmZqb2lyZGNkbHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzEyNzksImV4cCI6MjA4NTcwNzI3OX0.qqkdcJ3uFX3Ji_p-AjbSwGXfk8PtSCLMyM8Jj2GKMP4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testJacky() {
    console.log('Testing login for miss.jacky@muivc.com with password password123');

    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'miss.jacky@muivc.com',
        password: 'password123',
    });

    if (error) {
        console.error('LOGIN FAILED:', error.message);
    } else {
        console.log('LOGIN SUCCESSFUL!');
        console.log('User ID:', data.user.id);
    }
}

testJacky();
