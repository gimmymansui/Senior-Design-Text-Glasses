<!-- apps/vue-web-app/src/views/Transcriptions.vue -->
<template>
    <div class="container-page">
        <div class="transcription-header-bar"> <!-- New wrapper for title and button -->
            <div class="transcription-title">My Transcriptions</div>
            <button @click="fetchTranscriptions" :disabled="isLoading" class="sync-button">
                <span v-if="isLoading">Syncing...</span>
                <span v-else>Sync</span>
            </button>
        </div>

        <!-- Loading Indicator -->
        <div v-if="isLoading" class="loading-indicator">Loading transcriptions...</div>

        <!-- Error Message -->
        <div v-if="error" class="error-message">{{ error }}</div>

        <!-- Transcription List -->
        <div v-if="!isLoading && !error" class="transcription-list" id="transcriptionList">
            <!-- Use the 'transcriptions' ref now -->
            <router-link
                v-for="item in transcriptions"
                :key="item.id"
                :to="'/transcriptions/' + item.id"
                class="transcription-item-link"
            >
                <div class="transcription-item">
                    <div class="transcription-header">
                        <div class="transcription-title-item">{{ item.title }}</div>
                        <div class="transcription-date">{{ item.date }}</div>
                    </div>
                    <div class="transcription-preview">
                       {{ item.preview }}
                    </div>
                </div>
            </router-link>

            <!-- Message for no transcriptions -->
            <div v-if="!transcriptions.length && !isLoading" class="no-transcriptions-message">
                 No transcriptions found. Try syncing or record a new conversation.
             </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useBluetooth } from '../composables/useBluetooth';
import { useAuth } from '../composables/useAuth'; // Import useAuth

const { currentUser } = useAuth(); // Get auth state and method
const { latestTranscription } = useBluetooth(); // Get reactive state

// --- State ---
const transcriptions = ref([]); // Use this for actual data
const isLoading = ref(false); // Combined loading state for fetch/save
const error = ref(null); // Combined error state

// --- Methods ---

// Function to fetch transcriptions from the backend
async function fetchTranscriptions() {
    console.log("Attempting to fetch transcriptions...");
    isLoading.value = true;
    error.value = null;
    // Keep existing transcriptions while loading for better UX?
    // transcriptions.value = []; // Optional: Clear previous transcriptions immediately

    // --- 1. Check Login Status ---
    if (!currentUser.value) {
        console.warn("Cannot fetch transcriptions: User not logged in.");
        // error.value = "Please log in to view transcriptions."; // Optional: Show user-friendly message
        isLoading.value = false;
        transcriptions.value = []; // Clear list if user logs out during fetch attempt
        return;
    }
    const userId = currentUser.value.uid;

    // --- 2. Prepare Authentication & URL (from environment variables) ---
    const username = import.meta.env.VITE_API_USERNAME;
    const password = import.meta.env.VITE_API_PASSWORD;
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    if (!username || !password || !API_BASE_URL) {
        console.error("API credentials or URL (VITE_API_USERNAME, VITE_API_PASSWORD, VITE_API_URL) are not set.");
        error.value = "API configuration error.";
        isLoading.value = false;
        return;
    }

    const basicAuthString = btoa(`${username}:${password}`);
    // Assuming endpoint is /search/ and accepts user_id as a query parameter
    // const searchUrl = `${API_BASE_URL}/search/?user_id=${userId}`;
    const searchUrl = `${API_BASE_URL}/search/`; // URL without query parameter

    try {
        // console.log(`Fetching from: ${searchUrl}`);
        console.log(`Fetching from: ${searchUrl} using POST`);
        const response = await fetch(searchUrl, {
            // method: 'GET',
            method: 'POST', // Change method to POST
            headers: {
                'Authorization': `Basic ${basicAuthString}`,
                'Content-Type': 'application/json' // Indicate we're sending JSON
            },
            body: JSON.stringify({ user_id: userId }) // Send user_id in the request body
        });

        if (!response.ok) {
            const responseData = await response.json().catch(() => ({ detail: 'Failed to parse error response' }));
            throw new Error(responseData.detail || `HTTP error! status: ${response.status}`);
        }

        const fetchedData = await response.json();
        console.log("Transcriptions received:", fetchedData);

        // --- 3. Process and Store Fetched Data ---
        // Check if the response is an object with a 'conversations' array
        if (fetchedData && typeof fetchedData === 'object' && Array.isArray(fetchedData.conversations)) {
            
            // Store the original conversation objects directly in localStorage
             const originalConversations = fetchedData.conversations; 
             try {
                 const cacheKey = `userTranscriptions_${userId}`;
                 // Store the array of original conversation objects
                 localStorage.setItem(cacheKey, JSON.stringify(originalConversations)); 
                 console.log(`Stored ${originalConversations.length} original conversation objects to localStorage under key: ${cacheKey}`);
             } catch (storageError) {
                 console.error("Error saving original conversations to localStorage:", storageError);
             }

            // Now, map the original data *just* for the list display
             const mappedListItems = originalConversations.flatMap(item => {
                 // Try common ID fields from the backend item
                 const conversationId = item.conversation_id || item.id || item._id || item.uuid; // Add common possibilities

                 // Only proceed if we found a valid ID
                 if (conversationId) {
                     // Use startTime for date formatting if available, fallback to item.date
                     const dateString = item.startTime ? formatDate(item.startTime) : item.date || 'Unknown Date'; 
                     
                     // Generate preview from summary, conversation text, or first transcript segment
                     let previewText = 'No preview available';
                     if (item.summary) {
                         previewText = item.summary;
                     } else if (typeof item.conversation === 'string' && item.conversation.length > 0) {
                          previewText = item.conversation.substring(0, 100) + (item.conversation.length > 100 ? '...' : '');
                     } else if (Array.isArray(item.transcripts) && item.transcripts.length > 0 && item.transcripts[0].text) {
                          // Fallback: preview from first transcript segment's text
                          previewText = item.transcripts[0].text.substring(0, 100) + (item.transcripts[0].text.length > 100 ? '...' : '');
                     }
                     
                     // Derive title from item.title or date
                     const title = item.title || `Conversation from ${item.date || 'Unknown Date'}`; // Prefer item.date for title consistency unless startTime exists

                     // Return the mapped object in an array for flatMap
                     return [{
                         id: conversationId, // Use the found ID
                         title: title,
                         date: dateString, // Display formatted date/time if startTime was present
                         preview: previewText
                         // We don't need the full 'conversation' or 'transcripts' here for the list display
                     }];
                 } else {
                     // If no valid ID was found, log a warning and skip this item
                     console.warn("Skipping conversation item (for list display) due to missing ID:", item);
                     return []; // Return an empty array to effectively filter it out
                 }
             });
             transcriptions.value = mappedListItems; // Assign the filtered and mapped array for the template

        } else {
             console.warn("Received data is not in the expected format { conversations: [...] }:", fetchedData);
             error.value = "Unexpected data format received from server.";
             transcriptions.value = []; // Clear transcriptions on format error
             // --- localStorage Clearing on Error ---
             try {
                // Clear potentially stale cache if fetch fails or format is wrong
                localStorage.removeItem(`userTranscriptions_${userId}`);
                console.log(`Cleared localStorage transcription cache for user: ${userId}`);
             } catch (storageError) {
                 console.error("Error clearing transcription cache from localStorage:", storageError);
             }
             // --- END localStorage Clearing ---
        }

    } catch (err) {
        console.error("Error fetching transcriptions:", err);
        error.value = `Failed to fetch transcriptions: ${err.message}`;
        transcriptions.value = []; // Clear transcriptions on error
        // --- localStorage Clearing on Error ---
         try {
            // Clear potentially stale cache on network/fetch error
            localStorage.removeItem(`userTranscriptions_${userId}`);
            console.log(`Cleared localStorage transcription cache for user: ${userId}`);
         } catch (storageError) {
             console.error("Error clearing transcription cache from localStorage:", storageError);
         }
         // --- END localStorage Clearing ---
    } finally {
        isLoading.value = false;
    }
}

// Add formatDate helper if it doesn't exist (copy from TranscriptionDetail)
const formatDate = (isoString) => {
  // console.log("formatDate received:", isoString, typeof isoString); 
  if (!isoString) return 'Invalid Date';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString(); 
  } catch (e) { return 'Invalid Date'; }
};

// Watch for user login/logout to fetch/clear transcriptions
watch(currentUser, (newUser, oldUser) => {
     // Only fetch if the user state actually changes to logged in
     if (newUser && !oldUser) {
         console.log("User logged in, fetching transcriptions.");
         fetchTranscriptions();
     } else if (!newUser && oldUser) {
         console.log("User logged out, clearing transcriptions.");
         transcriptions.value = []; // Clear when user logs out
         error.value = null; // Clear any previous errors
     }
 });

// Fetch transcriptions when the component mounts if user is already logged in
onMounted(() => {
    console.log("Transcriptions component mounted");
    if (currentUser.value) {
         fetchTranscriptions();
    }
});

</script>

<style scoped>
/* Add specific styles from pages.css or style.css if needed */
.container-page {
  /* Remove old layout styles */
  /* padding: 20px;
  max-width: 800px;
  margin: 20px auto; */
  /* background-color: #f9f9f9; /* Example background */
  /* border-radius: 8px; */

  /* New layout styles */
  display: flex;
  flex-direction: column;
  flex-grow: 1; /* Grow to fill parent (.page-content) */
  width: 100%;
  height: 100%; /* Take full height of available space */
  padding: 0; /* Remove default padding */
  margin: 0; /* Remove default margin */
  /* background-color: #ffffff; /* Optional: set background */
}

.transcription-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 15px 10px 15px; /* Match title padding */
  flex-shrink: 0;
  /* border-bottom: 1px solid #eee; /* Optional separator */
}

.transcription-title {
  /* Remove padding from here if using header-bar padding */
  padding: 0;
  margin: 0; /* Remove default margins if any */
  /* Other title styles remain */
   font-size: 1.5em;
   font-weight: 600;
   color: #333;
}

.sync-button {
  padding: 8px 15px;
  background-color: #4CAF50; /* Example color */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.2s ease;
}

.sync-button:hover:not(:disabled) {
  background-color: #45a049;
}

.sync-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.loading-indicator,
.error-message,
.no-transcriptions-message {
  text-align: center;
  padding: 20px;
  color: #666;
  flex-grow: 1; /* Allow these messages to fill space if list is empty */
  display: flex;
  justify-content: center;
  align-items: center;
}

.error-message {
  color: #d9534f; /* Red color for errors */
  font-weight: bold;
}

.transcription-list {
  /* Ensure list still grows and scrolls */
  flex-grow: 1;
  overflow-y: auto;
  padding: 0 15px 15px 15px;
}

/* Ensure list doesn't show when loading/error/empty message is shown */
.transcription-list:has(.no-transcriptions-message) {
    /* Style differently if needed when empty message is shown inside */
}

/* Style for the router link wrapper */
.transcription-item-link {
  text-decoration: none; /* Remove underline from link */
  color: inherit; /* Inherit text color */
  display: block; /* Make link take full block */
  margin-bottom: 10px; /* Add space between links */
}

.transcription-item {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 10px;
  cursor: pointer; /* Optional: if items become clickable */
  transition: background-color 0.2s ease;
}
.transcription-item:hover {
   background-color: #f0f0f0; /* Example hover */
}

.transcription-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.transcription-title-item {
  font-weight: bold;
  color: #444;
}

.transcription-date {
  font-size: 0.9em;
  color: #777;
}

.transcription-preview {
  font-size: 0.95em;
  color: #555;
  line-height: 1.4;
  white-space: pre-wrap; /* Preserve line breaks from preview */
   overflow: hidden;
   text-overflow: ellipsis;
   /* Consider limiting height for previews */
   /* max-height: 60px; */
}

/* Add other styles as needed */
</style> 