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

async function syncAchievementsWithPhotos() {
  console.log('🚀 Fetching Firebase Achievements including Base64 Photos...\n');

  const achSnap = await db.collection('achievements').get();
  console.log(`Found ${achSnap.docs.length} achievements in Firebase.`);

  // 1. Clear existing Supabase achievements
  await supabase.from('achievements').delete().neq('title', '___NON_EXISTENT___');

  // 2. Re-insert with photo column
  for (const doc of achSnap.docs) {
    const data = doc.data();
    const photoData = data.photo || data.imageUrl || data.image || null;

    const row = {
      title: data.title || 'Achievement',
      student_name: data.studentName || data.student_name || '',
      category: data.category || '',
      date: data.date || '',
      description: data.description || '',
      photo: photoData
    };

    console.log(`Inserting "${row.student_name}" - Photo Length: ${photoData ? photoData.length : 0}`);

    const { error } = await supabase.from('achievements').insert([row]);
    if (error) {
      console.error(`❌ Insert Error for ${row.student_name}:`, error.message);
    } else {
      console.log(`✅ Success for ${row.student_name}!`);
    }
  }

  process.exit(0);
}

syncAchievementsWithPhotos();
