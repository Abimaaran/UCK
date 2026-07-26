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

async function inspectAndFixImages() {
  console.log('🔍 Inspecting Coaches and Achievements data in Firebase & Supabase...\n');

  // 1. Check Coaches in Firebase
  const coachSnap = await db.collection('coaches').get();
  console.log('--- Firebase Coaches ---');
  coachSnap.docs.forEach(doc => console.log(doc.id, '=>', doc.data()));

  // 2. Check Achievements in Firebase
  const achSnap = await db.collection('achievements').get();
  console.log('\n--- Firebase Achievements ---');
  achSnap.docs.forEach(doc => console.log(doc.id, '=>', doc.data()));

  // 3. Clear Supabase Coaches & Achievements and re-migrate with full field mapping
  console.log('\n🔄 Re-syncing Coaches to Supabase with image_url...');
  await supabase.from('coaches').delete().neq('name', '___NON_EXISTENT___');
  
  for (const doc of coachSnap.docs) {
    const data = doc.data();
    const row = {
      name: data.name || data.coachName || 'Coach',
      title: data.title || data.role || '',
      fide_rating: data.fideRating || data.fide_rating || data.rating || '',
      experience: data.experience || '',
      bio: data.bio || data.description || '',
      image_url: data.imageUrl || data.image_url || data.image || data.photo || ''
    };
    const { error } = await supabase.from('coaches').insert([row]);
    if (error) console.error('Coach Insert Error:', error.message);
    else console.log(`✅ Coach "${row.name}" inserted with image: ${row.image_url ? 'YES' : 'NO'}`);
  }

  console.log('\n🔄 Re-syncing Achievements to Supabase...');
  await supabase.from('achievements').delete().neq('title', '___NON_EXISTENT___');

  for (const doc of achSnap.docs) {
    const data = doc.data();
    const row = {
      title: data.title || data.name || 'Achievement',
      student_name: data.studentName || data.student_name || data.student || '',
      category: data.category || '',
      date: data.date || '',
      description: data.description || data.bio || ''
    };
    const { error } = await supabase.from('achievements').insert([row]);
    if (error) console.error('Achievement Insert Error:', error.message);
    else console.log(`✅ Achievement "${row.title}" inserted.`);
  }

  console.log('\n🎉 Coaches images & Achievements migration fixed!');
  process.exit(0);
}

inspectAndFixImages();
