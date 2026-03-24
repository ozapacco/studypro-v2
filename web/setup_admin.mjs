import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing ENV variables");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function setup() {
  const email = 'admin@studypro.local';
  const password = 'admin-studypro-password-123';

  // Try to create the user, autoConfirm: true
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Usuário Principal' }
  });

  if (error && error.message.includes('already been registered')) {
    console.log('User already exists, updating password...');
    // update password just to be sure
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const adminUser = users.users.find(u => u.email === email);
    if (adminUser) {
        await supabaseAdmin.auth.admin.updateUserById(adminUser.id, { password, email_confirm: true });
        console.log('Password updated.');
    }
  } else if (error) {
    console.error('Error creating user:', error);
  } else {
    console.log('Admin user created successfully:', data.user.id);
  }
}

setup();
