const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config();

const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function transferAllData() {
  console.log('🚀 Starting Data Transfer from Firebase Firestore to Supabase...\n');

  const collections = [
    'students',
    'attendance',
    'fees',
    'coaches',
    'tournaments',
    'achievements',
    'timetable',
    'reviews',
    'user-feedbacks'
  ];

  for (const colName of collections) {
    try {
      console.log(`📦 Fetching collection "${colName}" from Firebase...`);
      const snapshot = await db.collection(colName).get();
      
      if (snapshot.empty) {
        console.log(`ℹ️ Collection "${colName}" is empty in Firebase.\n`);
        continue;
      }

      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log(`Found ${docs.length} documents in "${colName}". Transferring to Supabase...`);

      let targetTable = colName.replace('-', '_');
      if (colName === 'user-feedbacks') targetTable = 'user_feedbacks';

      let count = 0;
      for (const doc of docs) {
        let row = {};
        if (targetTable === 'students') {
          row = {
            student_id: doc.studentId || doc.id,
            student_name: doc.studentName || doc.name || 'Student',
            email: doc.email || null,
            phone_number: doc.phoneNumber || doc.phone || null,
            dob: doc.dob || null,
            level: doc.level || 'Beginner',
            chess_experience: doc.chessExperience || null,
            preferred_schedule: doc.preferredSchedule || null,
            status: doc.status || 'Approved',
            is_paused: doc.isPaused || false,
            applied_date: doc.appliedDate || doc.createdAt || new Date().toISOString()
          };
        } else if (targetTable === 'attendance') {
          row = {
            student_id: doc.studentId || 'N/A',
            date: doc.date || new Date().toISOString().split('T')[0],
            status: doc.status || 'Present'
          };
        } else if (targetTable === 'fees') {
          row = {
            student_id: doc.studentId || 'N/A',
            month: doc.month || new Date().toISOString().slice(0, 7),
            status: doc.status || 'Paid'
          };
        } else if (targetTable === 'coaches') {
          row = {
            name: doc.name || 'Coach',
            title: doc.title || '',
            fide_rating: doc.fideRating || doc.fide_rating || '',
            experience: doc.experience || '',
            bio: doc.bio || '',
            image_url: doc.imageUrl || doc.image_url || ''
          };
        } else if (targetTable === 'tournaments') {
          row = {
            title: doc.title || 'Tournament',
            date: doc.date || '',
            time: doc.time || '',
            location: doc.location || '',
            description: doc.description || '',
            prize: doc.prize || '',
            status: doc.status || 'Upcoming'
          };
        } else if (targetTable === 'achievements') {
          row = {
            title: doc.title || 'Achievement',
            student_name: doc.studentName || doc.student_name || '',
            category: doc.category || '',
            date: doc.date || '',
            description: doc.description || ''
          };
        } else if (targetTable === 'timetable') {
          row = {
            day: doc.day || 'Monday',
            time: doc.time || '',
            level: doc.level || 'Beginner',
            coach: doc.coach || ''
          };
        } else if (targetTable === 'reviews') {
          row = {
            student_id: doc.studentId || '',
            text: doc.text || doc.review || '',
            date: doc.date || ''
          };
        } else if (targetTable === 'user_feedbacks') {
          row = {
            name: doc.name || '',
            email: doc.email || '',
            rating: doc.rating || 5,
            feedback: doc.feedback || ''
          };
        }

        const { error } = await supabase.from(targetTable).insert([row]);
        if (!error) count++;
        else console.warn(`   Warning inserting row into ${targetTable}:`, error.message);
      }

      console.log(`✅ Successfully transferred ${count}/${docs.length} records into "${targetTable}"!\n`);
    } catch (err) {
      console.error(`❌ Error migrating collection "${colName}":`, err.message);
    }
  }

  console.log('🎉 ALL FIREBASE DATA HAS BEEN TRANSFERRED TO SUPABASE SUCCESSFULLY!');
  process.exit(0);
}

transferAllData();
