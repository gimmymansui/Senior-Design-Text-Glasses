import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyAsimd5cjQmj108uyMy83oocWvMeokZY8Y",
    authDomain: "smartglasses-grp31.firebaseapp.com",
    projectId: "smartglasses-grp31",
    storageBucket: "smartglasses-grp31.firebasestorage.app",
    messagingSenderId: "701613950813",
    appId: "1:701613950813:web:0691115bbb791dc2c58ab4",
    measurementId: "G-X7QFSW7TBG"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

console.log(app);
console.log(window.firebaseApp);
console.log(window.firebaseAnalytics);

// Since you have sign in/out buttons, let's add authentication functionality
const signInButton = document.getElementById('signInButton');
const signOutButton = document.getElementById('signOutButton');
const userDetails = document.getElementById('userDetails');
const userSignedIn = document.getElementById('userSignedIn');
const userSignedOut = document.getElementById('userSignedOut');

// Sign in with Google
signInButton.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        console.log('Signed in:', result.user);
    } catch (error) {
        console.error('Sign in error:', error);
    }
});

// Sign out
signOutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        console.log('Signed out');
    } catch (error) {
        console.error('Sign out error:', error);
    }
});

// Listen for auth state changes
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        userSignedOut.hidden = true;
        userSignedIn.hidden = false;
        userDetails.innerHTML = `
            <h3>Welcome ${user.displayName}!</h3>
            <img src="${user.photoURL}" alt="Profile picture" style="width: 50px; border-radius: 50%;">
            <p>Email: ${user.email}</p>
        `;
    } else {
        // User is signed out
        userSignedOut.hidden = false;
        userSignedIn.hidden = true;
        userDetails.innerHTML = '';
    }
});

// Export these if you need to use them in other files
export { app, auth, db, analytics };