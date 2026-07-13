const admin = require('firebase-admin');

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (err) {
    console.error('❌ Firebase: Failed to parse FIREBASE_SERVICE_ACCOUNT env variable:', err.message);
  }
}

if (!serviceAccount) {
  try {
    serviceAccount = require('../../serviceAccountKey.json');
  } catch (err) {
    console.error('❌ Firebase: Failed to load serviceAccountKey.json file:', err.message);
    process.exit(1);
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
