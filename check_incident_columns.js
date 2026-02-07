
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tywfdovkrfjoirdcdlxi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5d2Zkb3ZrcmZqb2lyZGNkbHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzEyNzksImV4cCI6MjA4NTcwNzI3OX0.qqkdcJ3uFX3Ji_p-AjbSwGXfk8PtSCLMyM8Jj2GKMP4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log('Checking incidents table columns...');

    try {
        // Try to select classroom_id from incidents. If it fails, it doesn't exist.
        const { data, error } = await supabase.from('incidents').select('classroom_id').limit(1);

        if (error) {
            console.log("❌ 'classroom_id' column likely DOES NOT exist or is not accessible.");
            console.log("Error details:", error.message);
        } else {
            console.log("✅ 'classroom_id' column EXISTS.");
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

checkColumns();
