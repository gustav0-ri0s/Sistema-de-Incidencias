
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tywfdovkrfjoirdcdlxi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5d2Zkb3ZrcmZqb2lyZGNkbHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzEyNzksImV4cCI6MjA4NTcwNzI3OX0.qqkdcJ3uFX3Ji_p-AjbSwGXfk8PtSCLMyM8Jj2GKMP4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUsers() {
    const users = [
        { email: 'supervisor@colegio.edu.pe', password: 'password123', role: 'supervisor', name: 'Supervisor General' },
        { email: 'docente@colegio.edu.pe', password: 'password123', role: 'docente', name: 'Juan Pérez (Docente)' }
    ];

    for (const user of users) {
        console.log(`Creating user: ${user.email}...`);

        const { data, error } = await supabase.auth.signUp({
            email: user.email,
            password: user.password,
        });

        if (error) {
            console.error(`FAILED (${user.email}):`, error.message);
        } else {
            console.log(`SUCCESS (${user.email})! User ID:`, data.user?.id);
        }
    }
}

createUsers();
