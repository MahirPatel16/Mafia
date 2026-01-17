// Firebase Configuration
// Replace these values with your Firebase project credentials
// You'll get these from Firebase Console -> Project Settings -> General -> Your apps

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

const firebaseConfig = {
    apiKey: "AIzaSyB5J7SxVFZigoHTYah5NUULI2aMJQ-ovyk",
    authDomain: "mafia-f73d5.firebaseapp.com",
    databaseURL: "https://mafia-f73d5-default-rtdb.firebaseio.com",
    projectId: "mafia-f73d5",
    storageBucket: "mafia-f73d5.appspot.com",
    messagingSenderId: "817235624495",
    appId: "1:817235624495:web:99eedeb5e922dee2023cda",
    measurementId: "G-BVWWLZ7Q6C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };

