<script setup>
import { useAuth } from './composables/useAuth';
import { useRouter } from 'vue-router'; // Import useRouter
import { uiState } from './store/uiStore'; // Import uiState
import LoginPromptModal from './components/LoginPromptModal.vue'; // Import modal component
import { useBluetooth } from './composables/useBluetooth'; // Added
import { ref, watch } from 'vue'; // Added ref, watch
// import defaultAvatar from './assets/default-avatar.png'; // Removed import

const router = useRouter(); // Initialize router

const {
    currentUser,
    isLoading,
    error: authError, // Rename error to avoid naming conflict if other errors exist
    signInWithGoogle,
    signOutUser
 } = useAuth();

// --- Bluetooth and Transcription Saving Setup ---
const { latestTranscription } = useBluetooth();

console.log("App.vue Setup: latestTranscription ref object:", latestTranscription);

const isSaving = ref(false);
const saveError = ref(null);

// Function to handle saving the transcription (moved to App.vue for global handling)
async function saveTranscription(transcriptionData) {
    console.log("App.vue: Processing transcription for saving:", transcriptionData);
    isSaving.value = true;
    saveError.value = null;

    // --- Basic validation ---
    if (!transcriptionData || typeof transcriptionData !== 'object' || transcriptionData === null) {
        console.error("App.vue: Invalid transcription data received.");
        saveError.value = "Invalid transcription data."; // Store error state if needed
        isSaving.value = false;
        return;
    }

    // --- 1. Get User ID ---
    // currentUser is already available from useAuth() above
    if (!currentUser.value) {
        console.warn("App.vue: User not logged in. Cannot save transcription.");
        // Optionally, notify user or handle differently
        isSaving.value = false;
        return;
    }
    const userId = currentUser.value.uid;

    // --- 2. Prepare Authentication (from environment variables) ---
    const username = import.meta.env.VITE_API_USERNAME;
    const password = import.meta.env.VITE_API_PASSWORD;
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    if (!username || !password || !API_BASE_URL) {
        console.error("App.vue: API credentials or URL are not set.");
        saveError.value = "API configuration error.";
        isSaving.value = false;
        return;
    }

    const basicAuthString = btoa(`${username}:${password}`);
    const storeUrl = `${API_BASE_URL}/store/`;

    // --- 3. Prepare Data for Upload ---
    const jsonContent = JSON.stringify(transcriptionData);
    const conversationBlob = new Blob([jsonContent], { type: 'application/json' });

    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("conversation_file", conversationBlob, "conversation.json");

    try {
        // --- 4. Make API Call ---
        console.log(`App.vue: Sending transcription to backend: User ID: ${userId}, URL: ${storeUrl}`);
        const response = await fetch(storeUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${basicAuthString}`
                // Content-Type is automatically set for FormData
            },
            body: formData
        });

        // --- Improved Error Handling ---
        if (!response.ok) {
            let errorDetail = `HTTP error! Status: ${response.status}`; // Default message
            try {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await response.json();
                    // Prefer a string 'detail' field if it exists
                    if (errorData && typeof errorData.detail === 'string') {
                        errorDetail = errorData.detail;
                    } else if (errorData) {
                        // Otherwise, stringify the whole JSON error object
                        errorDetail = `Server error: ${JSON.stringify(errorData)}`;
                    }
                } else {
                    // If not JSON, try to get the response as text
                    const errorText = await response.text();
                    if (errorText) {
                        errorDetail = `Server error: ${errorText}`;
                    }
                }
            } catch (parseError) {
                console.error("App.vue: Failed to parse error response:", parseError);
                // Keep the basic HTTP status error if parsing failed
            }
            throw new Error(errorDetail); // Throw error with the best detail we found
        }
        // --- End Improved Error Handling ---

        // If response was ok, parse the success data
        const responseData = await response.json();
        console.log("App.vue: Transcription stored successfully:", responseData);
        // Do NOT call fetchTranscriptions here - App.vue doesn't manage the list display
        // Maybe show a temporary success notification?
        // uiState.showSaveSuccess = true; setTimeout(() => uiState.showSaveSuccess = false, 3000);

    } catch (err) {
        // Log the potentially improved error message
        console.error("App.vue: Error storing transcription. Message:", err.message);
        // console.error("Full error object:", err);
        console.error("Full error object for inspection:", err); // Log full object for dev tools
        saveError.value = `Failed to save transcription: ${err.message || 'Unknown error'}`;
        // Maybe show a persistent error notification?
        // uiState.showSaveError = true; // Need a way to dismiss this
    } finally {
        isSaving.value = false;
    }
}

// Watch for new transcriptions coming from the Bluetooth composable (global scope)
watch(latestTranscription, (newTranscription) => {
    // Restore the original logic:
    console.log("App.vue: Watcher triggered. New Data:", newTranscription, "Current User:", currentUser.value);
    if (newTranscription && currentUser.value) { // Also check if user is logged in before saving
        console.log("App.vue: Watcher calling saveTranscription..."); // Add log
        saveTranscription(newTranscription);
        // Optional: Clear the transcription in the composable after processing?
        // useBluetooth().clearTranscription(); // Consider if this is needed
    } else if (newTranscription && !currentUser.value) {
         console.warn("App.vue: Received transcription but user is not logged in. Ignoring save.");
    }
    // --- End restored logic ---
}, { deep: true });

// --- End Bluetooth and Transcription Saving Setup ---

// --- Watch for Auth Changes to Clear Cache ---
watch(currentUser, (newUser, oldUser) => {
    // Check if the change represents a logout (went from logged in to logged out)
    if (!newUser && oldUser?.uid) { 
        console.log("App.vue: User logged out. Clearing transcription cache.");
        try {
            const userIdToClear = oldUser.uid; // Get ID from the user who just logged out
            const cacheKey = `userTranscriptions_${userIdToClear}`;
            localStorage.removeItem(cacheKey);
            console.log(`App.vue: Cleared localStorage transcription cache (key: ${cacheKey})`);
        } catch (storageError) {
            console.error("App.vue: Error clearing transcription cache from localStorage on logout:", storageError);
        }
    } else if (newUser && !oldUser) {
         console.log("App.vue: User logged in.");
         // Potentially trigger other actions on login if needed
    }
});
// --- End Auth Changes Watch ---

// Function to handle login attempt from modal
async function handleModalLogin() {
  uiState.showLoginModal = false; // Close modal first
  await signInWithGoogle();
  // Optionally, attempt to redirect to the originally intended route after login
  // This requires storing the intended route somewhere (e.g., in uiState)
  // For simplicity, we'll just let the user navigate manually after login for now.
}

// Removed sidebar methods

</script>

<template>
  <div id="app-shell">
    <div class="universe" id="universe"></div>

    <!-- Simple Top Bar for Auth -->
    <div class="top-auth-bar">
       <!-- Settings Icon Link (Left) -->
       <!-- <router-link to="/settings" class="top-bar-icon-link top-bar-left"> -->
       <router-link to="/settings" class="top-bar-icon-link">
         <span class="material-symbols-outlined top-bar-icon">settings</span>
       </router-link>

       <!-- Auth Section (Right) -->
       <!-- <div class="auth-section top-bar-right"> -->
       <div class="auth-section">
          <div v-if="isLoading">Loading...</div>
          <div v-else-if="currentUser" class="user-display">
              <!-- Using avatar if available, otherwise a placeholder icon -->
              <img v-if="currentUser.photoURL" :src="currentUser.photoURL" alt="User" class="nav-avatar">
              <!-- <span v-else class="top-bar-icon">👤</span> Placeholder User Icon -->
              <span v-else class="material-symbols-outlined top-bar-icon">account_circle</span>
              <!-- Optionally display name on hover/click later? Removed for now -->
              <!-- <span>{{ currentUser.displayName || 'User' }}</span> -->
              <!-- <button @click="signOutUser" class="icon-button logout-button">🚪</button> Placeholder Logout Icon -->
              <button @click="signOutUser" class="icon-button logout-button">
                  <span class="material-symbols-outlined">logout</span>
              </button>
          </div>
          <!-- <button v-else @click="signInWithGoogle" class="icon-button login-button">🔑</button> Placeholder Login Icon -->
          <button v-else @click="signInWithGoogle" class="icon-button login-button">
               <span class="material-symbols-outlined">login</span>
          </button>
           <!-- <div v-if="authError" class="auth-error">! {{ authError }}</div> -->
       </div>
    </div>

    <!-- Main content area -->
    <main class="page-content">
      <router-view />
    </main>

    <!-- Bottom Navigation Bar -->
    <nav class="bottom-nav">
      <!-- Home Link -->
      <router-link to="/" class="nav-link">
        <!-- <span class="nav-icon">🏠</span> Placeholder Home Icon -->
        <span class="material-symbols-outlined nav-icon">home</span>
        <span class="nav-label">Home</span>
      </router-link>

      <!-- Transcriptions Link -->
      <router-link 
        to="/transcriptions" 
        class="nav-link" 
        :class="{ 'disabled-link': !currentUser }"
      >
        <!-- <span class="nav-icon">📝</span> Placeholder Recordings Icon -->
        <span class="material-symbols-outlined nav-icon">article</span>
        <span class="nav-label">Recordings</span>
      </router-link>

      <!-- Glasses Status Link -->
      <router-link to="/status" class="nav-link">
        <!-- <span class="nav-icon">👓</span> Placeholder Glasses Icon -->
        <span class="material-symbols-outlined nav-icon">visibility</span>
        <span class="nav-label">Glasses</span>
      </router-link>

      <!-- Settings Link -->
      <!-- <router-link to="/settings" class="nav-link"> -->
      <!-- Account Link -->
      <router-link 
        to="/account" 
        class="nav-link"
        :class="{ 'disabled-link': !currentUser }"
      >
        <!-- <span class="material-symbols-outlined nav-icon">settings</span> -->
        <span class="material-symbols-outlined nav-icon">account_circle</span>
        <!-- <span class="nav-label">Settings</span> -->
        <span class="nav-label">Account</span>
      </router-link>
    </nav>

    <!-- Login Prompt Modal -->
    <LoginPromptModal 
      v-if="uiState.showLoginModal" 
      @close="uiState.showLoginModal = false"
      @login="handleModalLogin"
    />

    <!-- Removed footer for cleaner mobile look, can be added back -->
    <!-- <footer></footer> -->
  </div>
</template>

<style scoped>
/* Apply box-sizing to prevent padding/borders from expanding elements */
#app-shell,
#app-shell *,
#app-shell *::before,
#app-shell *::after {
  box-sizing: border-box;
}

/* Remove body margin which can cause overflow */
:global(body) {
  margin: 0;
  overscroll-behavior: none; /* Prevent pull-to-refresh/scroll-chaining */
}

/* --- Base App Shell Styles --- */
#app-shell {
  height: 100vh;
  overflow: hidden;
  background-color: #f0f2f5;
  display: flex;
  position: relative;
  color: #000000; /* Set default text color to black */
  flex-direction: column;
}
.page-content {
  flex-grow: 1;
  width: 100%;
  padding: 15px 5px; /* Further reduced horizontal padding */
  padding-top: 60px; /* Keep space for top bar (Corrected value) */
  padding-bottom: 60px; /* Keep space for bottom nav */
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;

  /* Add flex properties for centering */
  display: flex;
  flex-direction: column; /* Stack content vertically */
  justify-content: center; /* Center vertically */
  /* Optional: align-items: center; /* Center horizontally if needed */
}

/* --- Top Auth Bar --- */
.top-auth-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 15px; /* Adjusted padding for icons */
    background-color: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(5px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    z-index: 100;
    height: 50px; /* Reduced height */
}

/* Explicitly align direct children of the top bar */
.top-auth-bar > .top-bar-icon-link,
.top-auth-bar > .auth-section {
    align-self: center;
}

.auth-section {
    display: flex;
    align-items: center;
    gap: 10px;
}
.user-display {
    display: flex;
    align-items: center;
    gap: 8px;
}
.nav-avatar {
    width: 35px;
    height: 35px;
    border-radius: 50%;
    cursor: pointer; /* Make avatar clickable like a button */
}
.login-button {
    color: #007bff; /* Blue color for login icon */
}
.logout-button {
    color: #dc3545; /* Red color for logout icon */
}
.auth-error {
    color: red;
    font-size: 0.8em;
    font-weight: bold;
    position: absolute; /* Position error message if needed */
    right: 15px; /* Adjust positioning */
    bottom: -15px; /* Adjust positioning */
}

/* --- Bottom Navigation Bar --- */
.bottom-nav {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 60px;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.05);
  z-index: 100;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.nav-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #6c757d; /* Muted color */
  font-size: 0.75em; /* Smaller text */
  padding: 5px 0;
  flex-grow: 1; /* Allow links to take up space */
  text-align: center;
  transition: color 0.2s ease;
}

.nav-link .nav-icon {
  /* font-size: 1.5em; Icon size */
  font-size: 24px; /* Material Symbol standard size */
  margin-bottom: 2px;
  line-height: 1; /* Ensure proper vertical alignment */
  font-family: 'Material Symbols Outlined'; /* Explicitly set font */
}

.nav-link:hover {
  color: #007bff; /* Highlight color on hover */
}

/* Style for the active route */
.nav-link.router-link-exact-active {
  color: #007bff; /* Active color */
  font-weight: 600;
}

/* Style for disabled links */
.nav-link.disabled-link {
  color: #adb5bd; /* Lighter grey for disabled state */
  cursor: not-allowed; /* Keep visual cue */
}

.nav-link.disabled-link:hover {
  color: #adb5bd; /* Keep color the same on hover when disabled */
}

/* --- Universe Background Styles --- */
.universe {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  background: linear-gradient(135deg, #ece9e6 0%, #ffffff 100%);
}

/* Styles for top bar icon links/buttons */
.top-bar-icon-link,
.icon-button {
    display: inline-flex; /* Use inline-flex for alignment */
    align-items: center;
    justify-content: center;
    padding: 5px; /* Small padding around icon */
    background: none;
    border: none;
    cursor: pointer;
    color: #333; /* Default icon color */
    font-size: 24px; /* Standard Material Symbol size */
    border-radius: 50%; /* Circular background on hover/focus */
    transition: background-color 0.2s ease, color 0.2s ease;
    width: 40px; /* Fixed width */
    height: 40px; /* Fixed height */
    text-decoration: none; /* Remove underline from link */
}

.top-bar-icon-link:hover,
.icon-button:hover {
    background-color: rgba(0, 0, 0, 0.05); /* Subtle background on hover */
}

.top-bar-icon-link:active,
.icon-button:active {
    background-color: rgba(0, 0, 0, 0.1); /* Darker background on press */
}

.top-bar-icon {
    /* If specific styling needed for the span icon itself */
    line-height: 1; /* Ensure icon is centered vertically */
    font-family: 'Material Symbols Outlined';
}
</style>

<!-- Global styles for scrollbar -->
<style>
/* Apply to the main scrollable content area */
main.page-content {
  /* Firefox */
  scrollbar-width: none; /* Hide scrollbar in Firefox */

  /* IE/Edge legacy */
  -ms-overflow-style: none;

  /* Webkit (Chrome, Safari, Edge) */
  &::-webkit-scrollbar {
    display: none; /* Hide scrollbar in WebKit */
  }
}

/* Also hide scrollbar on body just in case */
body {
  /* Firefox */
  scrollbar-width: none;
  /* IE/Edge legacy */
  -ms-overflow-style: none;
}
body::-webkit-scrollbar {
  /* Webkit */
  display: none;
}

/* Remove previous custom scrollbar styles */
/*
main.page-content {
  // ... previous thin scrollbar styles ...
}
*/
</style>