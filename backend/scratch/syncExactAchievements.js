const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function syncAchievementsWithFullFields() {
  console.log('🚀 Fetching exact Achievements documents from Firebase Firestore...\n');

  const achSnap = await db.collection('achievements').get();
  console.log(`Found ${achSnap.docs.length} achievements in Firebase:`);

  const achievementsData = [];
  achSnap.docs.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
    achievementsData.push({ id: doc.id, ...doc.data() });
  });

  // Clear Supabase achievements table
  console.log('\n🧹 Clearing Supabase achievements table...');
  await supabase.from('achievements').delete().neq('title', '___NON_EXISTENT___');

  console.log('📥 Inserting exact Firebase achievements data into Supabase...');
  for (const item of achievementsData) {
    const row = {
      title: item.title || item.name || item.achievementTitle || 'Achievement',
      student_name: item.studentName || item.student_name || item.name || item.student || '',
      category: item.category || item.type || item.level || '',
      date: item.date || item.year || item.eventDate || '',
      description: item.description || item.detail || item.details || item.bio || ''
    };

    const { error } = await supabase.from('achievements').insert([row]);
    if (error) console.error('❌ Insert Error:', error.message);
    else console.log(`✅ Inserted: "${row.title}" | Student: "${row.student_name}"`);
  }

  console.log('\n🎉 Achievements Sync Finished!');
  process.exit(0);
}

syncAchievementsWithFullFields();
