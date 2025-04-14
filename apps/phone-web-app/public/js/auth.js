// Firebase configuration from your existing config
const firebaseConfig = {
    apiKey: "AIzaSyByO6Jao6YnIQoUZInZc40zr6Rl-jQizpw",
    authDomain: "group31-project-2025-451402.firebaseapp.com",
    projectId: "group31-project-2025-451402",
    storageBucket: "group31-project-2025-451402.firebasestorage.app",
    messagingSenderId: "261308802493",
    appId: "1:261308802493:web:1a2f77a6ceb7672752ded4",
    measurementId: "G-HM2KV5T7FV"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Check if user is authenticated
function isAuthenticated() {
    return !!auth.currentUser;
}

// Redirect to login if not authenticated
function checkAuth(redirectUrl) {
    if (!isAuthenticated()) {
        // Store the intended destination
        sessionStorage.setItem('authRedirect', redirectUrl);
        window.location.href = 'index.html?showLogin=true';
        return false;
    }
    return true;
}

// Sign in with Google
function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    return auth.signInWithPopup(provider)
        .then((result) => {
            // Check if there's a redirect URL
            const redirectUrl = sessionStorage.getItem('authRedirect');
            if (redirectUrl) {
                sessionStorage.removeItem('authRedirect');
                window.location.href = redirectUrl;
            }
            return result.user;
        })
        .catch((error) => {
            console.error('Authentication error:', error);
            document.getElementById('loginError').textContent = error.message;
            document.getElementById('loginError').style.display = 'block';
        });
}

// Sign out
function signOut() {
    return auth.signOut()
        .then(() => {
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error('Sign out error:', error);
        });
}

// Export functions
window.firebaseAuth = {
    isAuthenticated,
    checkAuth,
    signInWithGoogle,
    signOut
}; 