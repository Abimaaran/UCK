const supabase = require('../src/config/supabaseClient');
const bcrypt = require('bcryptjs');

async function migrateData() {
  console.log('🚀 Starting Data Setup & Initial Seeding in Supabase...');

  // 1. Create Default Admin
  const adminEmail = 'admin@uck.com';
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const { data: existingAdmin } = await supabase.from('admins').select('*').eq('email', adminEmail).single();
  
  if (!existingAdmin) {
    const { error: adminErr } = await supabase.from('admins').insert([{
      email: adminEmail,
      password: hashedPassword
    }]);

    if (adminErr) console.error('❌ Admin seed error:', adminErr.message);
    else console.log('✅ Default Admin created: admin@uck.com / admin123');
  } else {
    console.log('ℹ️ Default Admin already exists.');
  }

  // 2. Initial Sample Coaches if empty
  const { data: coaches } = await supabase.from('coaches').select('id');
  if (!coaches || coaches.length === 0) {
    await supabase.from('coaches').insert([
      { name: 'Coach Arumugam', title: 'FIDE Master', fide_rating: '2150', experience: '10+ Years', bio: 'Senior Chess Trainer' },
      { name: 'Coach Vignesh', title: 'Candidate Master', fide_rating: '1980', experience: '6+ Years', bio: 'Tactics Specialist' }
    ]);
    console.log('✅ Sample Coaches seeded.');
  }

  // 3. Initial Sample Timetable if empty
  const { data: tt } = await supabase.from('timetable').select('id');
  if (!tt || tt.length === 0) {
    await supabase.from('timetable').insert([
      { day: 'Monday', time: '5:00 PM - 6:30 PM', level: 'Beginner', coach: 'Coach Arumugam' },
      { day: 'Wednesday', time: '6:00 PM - 7:30 PM', level: 'Intermediate', coach: 'Coach Vignesh' }
    ]);
    console.log('✅ Sample Timetable seeded.');
  }

  console.log('\n🎉 Seeding finished successfully!');
}

migrateData();
