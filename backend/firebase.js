const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://celluloidverse-7d324.firebaseio.com",
  });
}

const firestore = admin.firestore();
module.exports = { firestore };
