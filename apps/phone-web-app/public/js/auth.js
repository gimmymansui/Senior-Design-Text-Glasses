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

// Get Firebase Services
const auth = firebase.auth();
// const db = firebase.firestore(); // TEMPORARILY COMMENTED OUT

// --- Emulator Connection ---
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    console.log("AuthService: Connecting to Firebase Emulators");
    try {
        auth.useEmulator('http://localhost:9099');
        // db.useEmulator('localhost', 8081); // TEMPORARILY COMMENTED OUT
        console.log("AuthService: Connected to Auth Emulator."); // Updated log
    } catch (error) {
        console.error("AuthService: Error connecting to emulators:", error);
    }
} else {
    console.log("AuthService: Using production Firebase services.");
}

// --- Core Auth State Listener ---
let unsubscribeAuthStateListener = null; // To store the unsubscribe function

function setupAuthStateListener() {
    // Ensure any previous listener is detached
    if (unsubscribeAuthStateListener) {
        console.log("AuthService: Detaching previous auth state listener.");
        unsubscribeAuthStateListener();
    }

    console.log("AuthService: Setting up new auth state listener.");
    unsubscribeAuthStateListener = auth.onAuthStateChanged(user => {
        const protectedPages = ['transcription.html', 'account.html']; // Define protected pages
        const currentPage = window.location.pathname.split('/').pop() || 'index.html'; // Default to index.html if path is '/'
        console.log(`AuthService: onAuthStateChanged fired on page: ${currentPage}. User:`, user ? user.uid : 'null');

        // Ensure body exists before manipulating classList
        if (!document.body) {
             console.error("AuthService: document.body not found when auth state changed!");
             return;
        }

        if (user) {
            // --- User is SIGNED IN ---
            console.log('AuthService: User is authenticated.');
            document.body.classList.remove('auth-pending'); // Show content on ANY page if logged in

            // Update common UI elements (e.g., header user info) safely
            const userInfo = document.getElementById('userInfo');
            const userAvatar = document.getElementById('userAvatar');
            const userName = document.getElementById('userName');
            if (userInfo) userInfo.style.display = 'flex';
            if (userAvatar) userAvatar.src = user.photoURL || 'https://via.placeholder.com/40'; // Default avatar
            if (userName) userName.textContent = user.displayName || user.email;

            // Close login modal if it exists and is open
            const loginModal = document.getElementById('loginModal');
            if (loginModal && loginModal.style.display !== 'none') {
                console.log('AuthService: Closing login modal.');
                loginModal.style.display = 'none';
            }

            // Handle automatic redirect back after login
            const redirectUrl = sessionStorage.getItem('authRedirect');
            if (redirectUrl) {
                 console.log(`AuthService: Found redirect target in sessionStorage: ${redirectUrl}`);
                // Only redirect if we are currently on the index page (where login likely happened)
                // and the target is not the index page itself.
                if (currentPage === 'index.html' && redirectUrl !== 'index.html') {
                    sessionStorage.removeItem('authRedirect'); // Clean up before redirecting
                    console.log(`AuthService: Redirecting back to stored destination: ${redirectUrl}`);
                    window.location.href = redirectUrl;
                } else if (redirectUrl === currentPage) {
                    // If we somehow landed directly on the target page, just clear the flag
                     console.log(`AuthService: Already on redirect target page. Clearing sessionStorage.`);
                     sessionStorage.removeItem('authRedirect');
                } else {
                     console.log(`AuthService: Not on index.html or target is index.html. Not redirecting automatically.`);
                     // Consider clearing the item if not on index to prevent stale redirects
                     if (currentPage !== 'index.html') {
                        sessionStorage.removeItem('authRedirect');
                     }
                }
            }

        } else {
            // --- User is SIGNED OUT ---
            console.log('AuthService: User is NOT authenticated.');

             // Update common UI elements (hide user info) safely
            const userInfo = document.getElementById('userInfo');
            if (userInfo) userInfo.style.display = 'none';


            if (protectedPages.includes(currentPage)) {
                // --- On a PROTECTED page while logged out ---
                 console.log(`AuthService: On protected page (${currentPage}) without auth. Redirecting to login.`);
                // Store intended destination (unless it's index.html)
                if (currentPage !== 'index.html') {
                    sessionStorage.setItem('authRedirect', currentPage);
                     console.log(`AuthService: Stored ${currentPage} to sessionStorage.`);
                }
                 // Redirect to index only if not already there
                 if (currentPage !== 'index.html') {
                    window.location.href = 'index.html?showLogin=true';
                } else {
                     // If somehow index.html is protected and we are here, make sure content is hidden
                     document.body.classList.add('auth-pending'); // Should already be there, but enforce
                }
            } else {
                 // --- On a PUBLIC page while logged out ---
                 console.log(`AuthService: On public page (${currentPage}) without auth. Showing page.`);
                 document.body.classList.remove('auth-pending'); // Ensure public pages are visible
            }
        }
    });
}

// --- Set Persistence and Attach Listener ---
// We wrap listener setup in setPersistence to ensure order
auth.setPersistence(firebase.auth.Auth.Persistence.SESSION) // Or .LOCAL if preferred
    .then(() => {
        console.log(`AuthService: Persistence set to ${firebase.auth.Auth.Persistence.SESSION}.`);
        setupAuthStateListener(); // Attach the listener now
    })
    .catch((error) => {
        console.error('AuthService: Error setting persistence:', error);
        // Attempt to set up listener anyway, but persistence might be browser default
        setupAuthStateListener();
    });


// --- Sign-in / Sign-out Functions ---

function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    console.log("AuthService: Attempting Google Sign-In...");
    auth.signInWithPopup(provider)
        .then((result) => {
            console.log("AuthService: Google Sign-In successful. User:", result.user?.uid);
            // onAuthStateChanged will handle UI updates and redirects
        })
        .catch((error) => {
            console.error('AuthService: Google Sign-In Error:', error);
            // Display error to user on the login form
            const loginErrorElement = document.getElementById('loginError');
            if (loginErrorElement) {
                loginErrorElement.textContent = `Login failed: ${error.message}`;
                loginErrorElement.style.display = 'block';
            }
        });
}

function signOutUser() {
    console.log("AuthService: Attempting Sign-Out...");
    auth.signOut()
        .then(() => {
            console.log("AuthService: Sign-Out successful.");
            // onAuthStateChanged will handle UI updates and potential redirects
            // Clear any redirect target manually on explicit sign-out
             sessionStorage.removeItem('authRedirect');
              console.log("AuthService: Cleared authRedirect from sessionStorage.");
             // Explicitly redirect to index on sign out IF not already there.
             // This prevents staying on a page that might now be restricted after logout.
             if (window.location.pathname.split('/').pop() !== 'index.html') {
                 window.location.href = 'index.html';
             }

        })
        .catch((error) => {
            console.error('AuthService: Sign-Out Error:', error);
            // Potentially display this error to the user
        });
}

// --- Expose functions needed by HTML ---
window.authService = {
    signInWithGoogle,
    signOutUser,
    // Expose auth directly if needed for advanced cases (use carefully)
    // auth: auth
};

console.log("AuthService: auth.js loaded and initialized."); 