
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tywfdovkrfjoirdcdlxi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5d2Zkb3ZrcmZqb2lyZGNkbHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzEyNzksImV4cCI6MjA4NTcwNzI3OX0.qqkdcJ3uFX3Ji_p-AjbSwGXfk8PtSCLMyM8Jj2GKMP4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreateUser() {
    console.log('1. Logging in as Admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@colegio.edu.pe',
        password: 'password123',
    });

    if (authError || !authData.session) {
        console.error('Admin Login Failed:', authError?.message);
        return;
    }

    console.log('Admin Logged In. Token:', authData.session.access_token.substring(0, 20) + '...');

    const newEmail = `test_teacher_${Date.now()}@colegio.edu.pe`;
    const newPass = 'testpass123';

    console.log(`2. Calling RPC to create user: ${newEmail}...`);

    const { data: rpcData, error: rpcError } = await supabase.rpc('create_new_user', {
        email: newEmail,
        password: newPass,
        full_name: 'Test Teacher Created via RPC',
        role_name: 'docente'
    });

    if (rpcError) {
        console.error('RPC Failed:', rpcError.message);
        console.error('Details:', rpcError.details);
        console.error('Hint:', rpcError.hint);
    } else {
        console.log('RPC Successful! New User ID:', rpcData);

        // 3. Verify Login with new user
        console.log('3. Verifying login with new user...');
        // Create new client to avoid session conflict
        const client2 = createClient(supabaseUrl, supabaseKey);
        const { data: loginData, error: loginError } = await client2.auth.signInWithPassword({
            email: newEmail,
            password: newPass
        });

        if (loginError) {
            console.error('Verification Login Failed:', loginError.message);
        } else {
            console.log('Verification Login Successful! User ID:', loginData.user.id);
        }
    }
}

testCreateUser();
