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

async function checkAchievementPhotosInFirebase() {
  console.log('🔍 Checking raw fields of Achievements in Firebase...\n');
  const achSnap = await db.collection('achievements').get();
  
  achSnap.docs.forEach(doc => {
    console.log(`Document ID: ${doc.id}`);
    console.log(JSON.stringify(doc.data(), null, 2));
    console.log('-------------------------------------------');
  });

  process.exit(0);
}

checkAchievementPhotosInFirebase();
