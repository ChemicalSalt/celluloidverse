// backend/firebase.js
const admin = require("firebase-admin");
const serviceAccount = require("../bot/serviceAccountKey.json"); // path to your bot's service account

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://celluloidverse-7d324.firebaseio.com" // replace with your Firebase project URL
});

const db = admin.firestore();

module.exports = db;
