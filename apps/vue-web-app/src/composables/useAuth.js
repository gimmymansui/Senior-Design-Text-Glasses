import { ref, readonly, onUnmounted } from 'vue';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    getIdToken
} from 'firebase/auth';
import firebaseConfig from '../firebaseConfig'; // Import your config

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

// --- Reactive State ---
// Non-reactive holder for the user object to avoid potential issues with deep reactivity
let internalUser = null;
// Reactive refs exposed to components
const currentUser = ref(null); // Holds simplified user info { uid, displayName, email, photoURL } or null
const isLoading = ref(true); // True while checking initial auth state
const error = ref(null); // Holds auth error messages

// --- Singleton Management for Listener ---
// Ensures onAuthStateChanged is only attached once
let unsubscribe = null;
if (!unsubscribe) {
    console.log("Setting up onAuthStateChanged listener...");
    unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log("Auth state changed. User:", user ? user.uid : 'null');
        if (user) {
             internalUser = user; // Keep the full user object internally
            // Expose only necessary, serializable fields reactively
            currentUser.value = {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL
            };
        } else {
             internalUser = null;
            currentUser.value = null;
        }
        isLoading.value = false; // Finished initial check
        error.value = null; // Clear error on successful state change
    }, (authError) => {
        // Handle errors during listener setup or auth state changes
        console.error("Error in onAuthStateChanged:", authError);
        error.value = authError.message || "Authentication error.";
        internalUser = null;
        currentUser.value = null;
        isLoading.value = false;
    });
}

// --- Composable Function ---
export function useAuth() {

    // --- Methods ---
    const signInWithGoogle = async () => {
        isLoading.value = true;
        error.value = null;
        try {
            await signInWithPopup(auth, googleProvider);
            // onAuthStateChanged will handle setting currentUser
        } catch (err) {
            console.error("Error signing in with Google:", err);
            error.value = err.message || "Failed to sign in.";
             internalUser = null; // Ensure reset on failure
             currentUser.value = null;
        } finally {
            // isLoading state is managed by onAuthStateChanged,
            // but ensure it becomes false if popup fails before state change fires
             if (isLoading.value && !currentUser.value) {
                  isLoading.value = false;
             }
        }
    };

    const signOutUser = async () => {
        isLoading.value = true;
        error.value = null;
        try {
            await signOut(auth);
            // onAuthStateChanged will handle setting currentUser to null
        } catch (err) {
            console.error("Error signing out:", err);
            error.value = err.message || "Failed to sign out.";
            // isLoading should be handled by onAuthStateChanged, but set just in case
             isLoading.value = false;
        }
    };

    const getToken = async (forceRefresh = false) => {
        if (!internalUser) {
            console.warn("Cannot get token: No user logged in.");
            return null;
        }
        try {
            const token = await getIdToken(internalUser, forceRefresh);
            return token;
        } catch (err) {
            console.error("Error getting ID token:", err);
            error.value = err.message || "Failed to get authentication token.";
            // Consider signing out the user if token refresh fails critically
            // await signOutUser();
            return null;
        }
    };

    // --- Cleanup ---
    // Note: Since the listener is global/singleton, cleanup might be tricky
    // if multiple components use the composable. For a typical SPA,
    // cleaning up when the *app* unmounts might be desired, but Vue's
    // onUnmounted is component-specific. This highlights why a plugin
    // or Pinia store is often better for managing global singletons like auth.
    // For now, we won't automatically unsubscribe here.
    // onUnmounted(() => {
    //     if (unsubscribe) {
    //         console.log("Unsubscribing from onAuthStateChanged");
    //         unsubscribe();
    //         unsubscribe = null; // Prevent multiple unsubscribes
    //     }
    // });

    // --- Return reactive state and methods ---
    return {
        currentUser: readonly(currentUser), // Readonly ref for components
        isLoading: readonly(isLoading),
        error: readonly(error),
        signInWithGoogle,
        signOutUser,
        getToken,
    };
} 