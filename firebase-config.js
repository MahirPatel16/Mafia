// Firebase Configuration
// Replace these values with your Firebase project credentials
// You'll get these from Firebase Console -> Project Settings -> General -> Your apps

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

const firebaseConfig = {
    apiKey: "AIzaSyB5J7SxVFZigoHTYah5NUULI2aMJQ-ovyk",
    authDomain: "mafia-f73d5.firebaseapp.com",
    databaseURL: "https://mafia-f73d5-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "mafia-f73d5",
    storageBucket: "mafia-f73d5.appspot.com",
    messagingSenderId: "817235624495",
    appId: "1:817235624495:web:99eedeb5e922dee2023cda",
    measurementId: "G-BVWWLZ7Q6C"
};

// Initialize Firebase
let app, database;

try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization error:', error);
    alert('Firebase configuration error! Please check your firebase-config.js file.');
}

export { database };

