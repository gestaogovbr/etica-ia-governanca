import * as admin from 'firebase-admin';

export function initializeFirebase() {
  const serviceAccount = JSON.parse(process.env.FIREBASE || '{}');
  console.log('Bucket Name Root:', process.env.BUCKET_NAME_ROOT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: `${process.env.BUCKET_NAME_ROOT}.firebasestorage.app`
  });
}
