const admin = require('firebase-admin');

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (err) {
    console.warn('⚠️ Firebase: Failed to parse FIREBASE_SERVICE_ACCOUNT env variable:', err.message);
  }
}

if (!serviceAccount) {
  try {
    serviceAccount = require('../../serviceAccountKey.json');
  } catch (err) {
    console.warn('⚠️ Firebase: Service Account key not found, using Supabase.');
  }
}

let db = null;
let auth = null;

if (serviceAccount && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    auth = admin.auth();
  } catch (e) {
    console.warn('⚠️ Firebase initialization skipped.');
  }
}

module.exports = { admin, db, auth };
