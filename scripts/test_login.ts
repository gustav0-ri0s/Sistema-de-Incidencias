
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tywfdovkrfjoirdcdlxi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5d2Zkb3ZrcmZqb2lyZGNkbHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzEyNzksImV4cCI6MjA4NTcwNzI3OX0.qqkdcJ3uFX3Ji_p-AjbSwGXfk8PtSCLMyM8Jj2GKMP4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
    console.log('Testing login for admin@colegio.edu.pe...');

    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@colegio.edu.pe',
        password: 'password123',
    });

    if (error) {
        console.error('LOGIN FAILED:', error.message);
    } else {
        console.log('LOGIN SUCCESSFUL!');
        console.log('User ID:', data.user.id);
        console.log('Access Token:', data.session.access_token.substring(0, 20) + '...');
    }
}

testLogin();
