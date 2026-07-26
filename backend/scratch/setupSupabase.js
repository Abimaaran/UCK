const supabase = require('../src/config/supabaseClient');
const fs = require('fs');
const path = require('path');

async function setupTables() {
  console.log('🚀 Creating tables in Supabase...');

  const schemaSql = fs.readFileSync(path.join(__dirname, '../src/config/schema.sql'), 'utf8');

  // Supabase JS doesn't have raw db.query API over REST, but we can execute SQL or check table existence
  // We can create initial admin user or check connection by attempting to select from admins.
  const { data, error } = await supabase.from('admins').select('*').limit(1);

  if (error && error.code === 'PGRST301') {
    console.log('⚠️  Tables not yet created in Supabase Dashboard.');
  } else if (error) {
    console.log('Notice:', error.message);
  } else {
    console.log('✅ Admins table exists in Supabase!');
  }
}

setupTables();
