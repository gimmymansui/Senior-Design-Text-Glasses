<template>
  <div class="detail-container">
    <div v-if="isLoading" class="loading">Loading transcription...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="transcription" class="transcription-content">
      <h2 class="detail-title">{{ detailTitle }}</h2>
      <p class="detail-date">{{ detailDate }}</p>
      <hr class="separator">
      
      <div class="detail-full-text">
        <!-- Loop through transcript segments -->
        <div v-for="segment in transcription.transcripts" :key="segment.sentenceId || segment.timestamp" class="transcript-segment">
            <!-- Editable Speaker Label -->
            <span v-if="editingSpeakerOriginal !== segment.speaker" 
                  class="speaker-label editable" 
                  :style="{ color: getSpeakerColor(segment.speaker) }"
                  @click="startEditing(segment.speaker)" 
                  title="Click to edit speaker name"
            >
                {{ getDisplayName(segment.speaker) }}:
            </span>
            <input v-else 
                   type="text" 
                   v-model="currentEditValue" 
                   class="speaker-input"
                   @blur="saveEdit(segment.speaker)" 
                   @keyup.enter="saveEdit(segment.speaker)"
                   @keyup.esc="cancelEdit"
                   ref="speakerInputRef" 
            />
            <span class="segment-text">{{ segment.text }}</span>
        </div>
      </div>
      
      <!-- Add Summary Section -->
      <hr class="separator"> 
      <div class="summary-section">
          <button 
              @click="summarizeConversation" 
              :disabled="isSummarizing || !transcription" 
              class="summarize-button"
          >
              <span v-if="isSummarizing">Summarizing...</span>
              <span v-else>Summarise</span>
          </button>
          <div v-if="summarizeError" class="error summary-error">
              Error summarizing: {{ summarizeError }}
          </div>
          <div v-if="summaryText" class="summary-result">
              <h3>Summary:</h3>
              <p>{{ summaryText }}</p>
          </div>
      </div>
      <!-- End Summary Section -->

    </div>
    <div v-else class="not-found">Transcription not found.</div>

    <button @click="goBack" class="back-button">Back to List</button>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth'; // Import useAuth

// Get current user for cache key
const { currentUser } = useAuth();

// --- Helper Function ---
const formatDate = (isoString) => {
  console.log("formatDate received:", isoString, typeof isoString);
  if (!isoString) {
       console.log("formatDate returning 'Invalid Date' due to falsy input.");
       return 'Invalid Date';
  }
  try {
    const date = new Date(isoString);
    // Check if the date is valid after parsing
    if (isNaN(date.getTime())) {
        console.log(`formatDate could not parse '${isoString}' into a valid Date object.`);
        return 'Invalid Date';
    }
    return date.toLocaleString(); // Simple locale-based date and time
  } catch (e) {
     console.error(`formatDate error parsing '${isoString}':`, e);
    return 'Invalid Date';
  }
};

// --- Placeholder Data (New Format) ---
// In a real app, you'd fetch this based on the ID from an API/store
const allTranscriptionDetails = ref({
  '1745182267095': { // Using the ID from your example
    id: "1745182267095",
    startTime: "2025-04-20T20:51:07.095Z",
    endTime: "2025-04-20T20:51:14.392Z",
    transcripts: [
      {
        speaker: "Speaker 1",
        text: "you know oh yes yet it's easy okay you want to steal the only thing the uci do we use a neighbor which is rich oh okay because even it's very stressful talking with a reseach for a single knows that that's an idea i should say particular one this is not helped me with your other music projects okay when your photo do you test you causation tree assume just like always pushing the c test every from bring the conversation let me just go through here go to freelancer so so so so disheartening between and i'm thinking oh we hold on today is that the point needs to work does rushing so ah the whole boy from the from the bluetooth to the to the lineup do the be civil yeah i did something like that like the traffic and some related to somebody i really give to somebody trying to get appointed time with the company okay back to quick revenue table disney for this state's needs was one of the devices tonight notables i revive at least five three hundred professionals it's is business to summarize yeah but previously like here's a summary yes she is a nurse and i've just found the proof of which we own to be on undercover we also have a flight from us as summary back saved a conversation because my backyard but somehow now we don't work on my mother's because we've got some august for about six to the west this week this must be we've got to test that sort of opposite musky somebody forgot to eat yourself that's how you get somewhere because i haven't have you got the system army t whatever the trigger yeah conscripts menu the whole population of the world episode like i did it that probably twenty seven if i can't do this you can ask around i think i mean yeah they have yeah fifteen excel and you take a transcript okay yeah we don't get given that number but the other one summer soldiers so you can book them to have somebody well they will not be multiple choice programs so what's up baby the seven years yeah so so so so it's when you actually hear from a diverse set who said as of right now so yeah plus varies screw this seven oils actually opposed to cancer the pod receives the arctic sort of voices the of when we use open mic so as rally the surround the inn basically just correspond so i receive a text mother and son what has charles and the strains on wanting the light oh that's actually mine so because my understanding what have you it's fuck fuck fuck for for four four for for for for no no no next oh so this whole thing in i've um it was like yet one change something yeah i guess well that doesn't matter because i can still connect to the the for connectivity a bit of us it doesn't seem like my god okay everyone has like an shit stopping okay yeah is it",
        timestamp: "2025-04-20T20:51:10.925Z",
        sentenceId: 1745182270925
      },
      {
        speaker: "Speaker 1",
        text: "you know oh yes yet it's easy okay you want to steal the only thing the uci do we use a neighbor which is rich oh okay because even it's very stressful talking with a reseach for a single knows that that's an idea i should say particular one this is not helped me with your other music projects okay when your photo do you test you causation tree assume just like always pushing the c test every from bring the conversation let me just go through here go to freelancer so so so so disheartening between and i'm thinking oh we hold on today is that the point needs to work does rushing so ah the whole boy from the from the bluetooth to the to the lineup do the be civil yeah i did something like that like the traffic and some related to somebody i really give to somebody trying to get appointed time with the company okay back to quick revenue table disney for this state's needs was one of the devices tonight notables i revive at least five three hundred professionals it's is business to summarize yeah but previously like here's a summary yes she is a nurse and i've just found the proof of which we own to be on undercover we also have a flight from us as summary back saved a conversation because my backyard but somehow now we don't work on my mother's because we've got some august for about six to the west this week this must be we've got to test that sort of opposite musky somebody forgot to eat yourself that's how you get somewhere because i haven't have you got the system army t whatever the trigger yeah conscripts menu the whole population of the world episode like i did it that probably twenty seven if i can't do this you can ask around i think i mean yeah they have yeah fifteen excel and you take a transcript okay yeah we don't get given that number but the other one summer soldiers so you can book them to have somebody well they will not be multiple choice programs so what's up baby the seven years yeah so so so so it's when you actually hear from a diverse set who said as of right now so yeah plus varies screw this seven oils actually opposed to cancer the pod receives the arctic sort of voices the of when we use open mic so as rally the surround the inn basically just correspond so i receive a text mother and son what has charles and the strains on wanting the light oh that's actually mine so because my understanding what have you it's fuck fuck fuck for for four four for for for for no no no next oh so this whole thing in i've um it was like yet one change something yeah i guess well that doesn't matter because i can still connect to the the for connectivity a bit of us it doesn't seem like my god okay everyone has like an shit stopping okay yeah is it you",
        timestamp: "2025-04-20T20:51:11.563Z",
        sentenceId: 1745182271563
      }
    ]
  },
  'placeholder2': { // A second dummy entry
    id: "placeholder2",
    startTime: "2025-04-19T10:00:00.000Z",
    endTime: "2025-04-19T10:05:00.000Z",
    transcripts: [
      { speaker: "Speaker A", text: "This is the first part of the second conversation.", timestamp: "2025-04-19T10:00:05.000Z", sentenceId: 1 },
      { speaker: "Speaker B", text: "And this is the response.", timestamp: "2025-04-19T10:00:10.000Z", sentenceId: 2 }
    ]
  }
});
// --- End Placeholder Data ---


const route = useRoute();
const router = useRouter();
const isLoading = ref(false);
const error = ref(null);

// Template ref for the input element
const speakerInputRef = ref(null); 

// The ID from the route will be a string
const transcriptionId = computed(() => route.params.id);

const transcription = ref(null);

// --- Speaker Name Mapping ---
const speakerNameMap = ref({}); // Stores { originalSpeaker: editedName }
const editingSpeakerOriginal = ref(null); // Track which *original* speaker label is being edited
const currentEditValue = ref(''); // Temp storage for the input field value

// Initialize or reset the speaker map when transcription data loads
const initializeSpeakerMap = (transcripts) => {
  const initialMap = {};
  if (Array.isArray(transcripts)) {
    transcripts.forEach(segment => {
      if (!initialMap[segment.speaker]) {
        // Initialize with original name if not already edited/mapped
        initialMap[segment.speaker] = speakerNameMap.value[segment.speaker] || segment.speaker;
      }
    });
  }
  speakerNameMap.value = initialMap;
  console.log("Initialized Speaker Map:", speakerNameMap.value);
};

// Get the display name (either edited or original)
const getDisplayName = (originalSpeaker) => {
  return speakerNameMap.value[originalSpeaker] || originalSpeaker;
};

// --- Speaker Color Logic ---
const speakerColors = ref({}); // Stores assigned colors { speakerName: color }
const colorPalette = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6f42c1']; // Example palette
let colorIndex = 0;

const getSpeakerColor = (speakerName) => {
  if (!speakerColors.value[speakerName]) {
    // Assign the next color in the palette
    speakerColors.value[speakerName] = colorPalette[colorIndex % colorPalette.length];
    colorIndex++;
  }
  return speakerColors.value[speakerName];
};
// --- End Speaker Color Logic ---

// --- Edit Handling ---
const startEditing = (originalSpeaker) => {
  editingSpeakerOriginal.value = originalSpeaker;
  currentEditValue.value = getDisplayName(originalSpeaker); // Start input with current display name
  // Use nextTick to wait for the input to be rendered before focusing
  nextTick(() => {
    speakerInputRef.value?.focus();
  });
};

const saveEdit = (originalSpeaker) => {
  if (editingSpeakerOriginal.value === originalSpeaker && currentEditValue.value.trim() !== '') {
    speakerNameMap.value[originalSpeaker] = currentEditValue.value.trim();
  }
  cancelEdit(); // Exit edit mode
};

const cancelEdit = () => {
  editingSpeakerOriginal.value = null;
  currentEditValue.value = '';
};

// --- End Edit Handling ---

// Generate Title - Use date as fallback
const detailTitle = computed(() => {
    if (transcription.value?.startTime) {
        // If startTime exists, format it
        return `Conversation on ${formatDate(transcription.value.startTime)}`;
    } else if (transcription.value?.date) {
         // If only date exists, use it directly in the title
         return `Conversation from ${transcription.value.date}`;
    }
    // Default title if neither is available
    return 'Transcription Detail';
});

// Get formatted date string - Use date as fallback
const detailDate = computed(() => {
     if (transcription.value?.startTime) {
         // If startTime exists, format it
        return formatDate(transcription.value.startTime);
    } else if (transcription.value?.date) {
         // If only date exists, return it directly
        return transcription.value.date;
    }
    // Default if neither is available
    return 'No date available';
});

// --- Load transcription details ONLY from localStorage cache ---
function loadTranscriptionFromCache() {
  isLoading.value = true;
  error.value = null;
  transcription.value = null; // Reset first
  const idToFetch = transcriptionId.value;
  console.log(`Attempting to load details for ID: ${idToFetch} from cache.`);

  if (!currentUser.value?.uid) {
       console.warn("Cannot load from cache: User not logged in.");
       error.value = "Login required to view details.";
       isLoading.value = false;
       return;
  }

  const cacheKey = `userTranscriptions_${currentUser.value.uid}`;
  try {
      const cachedListString = localStorage.getItem(cacheKey);
      if (cachedListString) {
          const cachedList = JSON.parse(cachedListString);
          if (Array.isArray(cachedList)) {
              // Find item by ID - use the same ID fields as in Transcriptions.vue map
              const cachedItem = cachedList.find(item => String(item.conversation_id || item.id || item._id || item.uuid) === String(idToFetch)); 
              
              if (cachedItem) {
                  console.log("Found raw cached item:", cachedItem);
                  
                  // --- Attempt to parse raw_data ---
                  let parsedData = null;
                  if (cachedItem.raw_data && typeof cachedItem.raw_data === 'string') {
                      try {
                          parsedData = JSON.parse(cachedItem.raw_data);
                          console.log("Successfully parsed raw_data:", parsedData);
                      } catch (parseError) {
                          console.error("Error parsing raw_data JSON string:", parseError, "Raw data:", cachedItem.raw_data);
                          error.value = "Failed to parse cached transcription data.";
                          isLoading.value = false; // Ensure loading stops
                          return; // Stop processing if parsing fails
                      }
                  } else {
                      console.warn("Cached item found, but raw_data field is missing or not a string:", cachedItem);
                  }
                  // --- End parsing raw_data ---

                  // Use the parsed data if available, otherwise report error
                  if (parsedData) {
                      // Check if the essential 'transcripts' array exists in the PARSED data
                      if (Array.isArray(parsedData.transcripts)) {
                          transcription.value = parsedData; // Assign the PARSED object
                          console.log("DetailView - From Parsed Cache - startTime:", transcription.value?.startTime); // Use parsedData.startTime or transcription.value.startTime
                          console.log("DetailView - From Parsed Cache - date:", transcription.value?.date); // date might not exist in raw_data, only startTime
                          initializeSpeakerMap(parsedData.transcripts); // Use transcripts from parsed data
                      } else {
                          console.error("Parsed raw_data is missing the 'transcripts' array:", parsedData);
                          error.value = "Cached data structure is invalid (missing transcripts). Please sync list.";
                      }
                  } else {
                      // If raw_data wasn't present or couldn't be parsed
                      error.value = "Cached data is incomplete (missing details). Please sync list view.";
                  }

              } else {
                   console.log(`ID ${idToFetch} not found in cached list.`);
                   error.value = `Transcription with ID ${idToFetch} not found in cache. Please sync list.`;
              }
          } else {
               console.warn(`Invalid data found in localStorage for key ${cacheKey}.`);
               localStorage.removeItem(cacheKey); // Clear invalid cache
               error.value = "Cache was invalid. Please sync list view.";
          }
      } else {
           console.log(`No cache found in localStorage for key ${cacheKey}.`);
           error.value = "Transcription list not cached. Please sync list view.";
      }
  } catch (cacheError) {
      console.error("Error reading or parsing localStorage cache:", cacheError);
      error.value = "Failed to read transcription cache.";
  } finally {
      isLoading.value = false;
  }
}

// --- Add State for Summarization ---
const isSummarizing = ref(false);
const summaryText = ref(null);
const summarizeError = ref(null);
// --- End Summarization State ---

// --- NEW: Function to call Summarise Endpoint ---
async function summarizeConversation() {
    // --- Use the ID from the route params ---
    // const conversationId = transcription.value.id; // OLD: ID from parsed data
    const conversationId = transcriptionId.value; // NEW: ID from the route (e.g., '55')
    // --- End change ---

    if (!conversationId) { // Also check if the route ID is valid
        console.error("Cannot summarize: Route ID is missing.");
        summarizeError.value = "Transcription ID missing.";
        return;
    }
    
    // No change needed to the check below, as transcription.value should still exist
    if (!transcription.value) { 
        console.error("Cannot summarize: Transcription data is not loaded.");
        summarizeError.value = "Transcription data missing.";
        return;
    }

    isSummarizing.value = true;
    summaryText.value = null;
    summarizeError.value = null;

    console.log(`Requesting summary for conversation ID: ${conversationId} via POST with payload (matching Python script)`); 

    // --- Prepare Auth and URL ---
    const username = import.meta.env.VITE_API_USERNAME;
    const password = import.meta.env.VITE_API_PASSWORD;
    const url = import.meta.env.VITE_SUMMARIZE_API_URL;
    const summarizeUrl = `${url}/summarize/`;

    if (!username || !password || !summarizeUrl) {
        console.error("Summarize: API credentials or URL are not set.");
        summarizeError.value = "API configuration error.";
        isSummarizing.value = false;
        return;
    }

    const basicAuthString = btoa(`${username}:${password}`);
    

    try {
        // Use the 'summarizeUrl' variable defined from environment variables
        const response = await fetch(summarizeUrl, { // Use plain URL from env var
            method: 'POST', // Use POST method
            headers: {
                'Authorization': `Basic ${basicAuthString}`,
                 // Include header as in Python script
                'Content-Type': 'application/json' // Specify JSON payload
            },
             // Include the body payload with the POST request
            body: JSON.stringify({ conversation_id: parseInt(conversationId, 10) }) // Convert ID to integer
        });

        // --- Handle Response ---
        if (!response.ok) {
            let errorDetail = `HTTP error! Status: ${response.status}`;
            try {
                const errorData = await response.json();
                // Assuming error detail is in 'detail' or maybe 'error' field
                if (errorData && typeof errorData.detail === 'string') {
                    errorDetail = errorData.detail;
                } else if (errorData && typeof errorData.error === 'string') {
                     errorDetail = errorData.error;
                } else if (errorData) {
                    errorDetail = `Server error: ${JSON.stringify(errorData)}`;
                }
            } catch (parseError) { /* Ignore parsing error, use status code */ }
            throw new Error(errorDetail);
        }

        // If response is OK, parse and set summary
        const resultData = await response.json();
        console.log("Summarise endpoint response:", resultData);

        // *** Adjust based on actual response structure ***
        // Assuming the summary text is in a 'summary' field
        if (resultData && typeof resultData.summary === 'string') {
            summaryText.value = resultData.summary;
        } else {
            console.error("Summarise response missing 'summary' string field:", resultData);
            throw new Error("Received unexpected summary format from server.");
        }

    } catch (err) {
        console.error("Summarize error:", err);
        summarizeError.value = err.message || 'Failed to get summary.';
    } finally {
        isSummarizing.value = false;
    }
}
// --- End Summarise Function ---

const goBack = () => {
  router.push('/transcriptions'); // Navigate back to the list view
};

onMounted(() => {
  loadTranscriptionFromCache();
});

</script>

<style scoped>
.detail-container {
  padding: 20px;
  height: 100%; /* Fill parent */
  display: flex;
  flex-direction: column;
}

.transcription-content {
  flex-grow: 1;
  overflow-y: auto; /* Allow content scrolling */
  margin-bottom: 15px;

  /* Add scrollbar hiding rules here */
  /* Firefox */
  scrollbar-width: none;
  /* IE/Edge legacy */
  -ms-overflow-style: none;
}

/* Webkit */
.transcription-content::-webkit-scrollbar {
  display: none;
}

.detail-title {
  font-size: 1.6em;
  font-weight: 600;
  margin-bottom: 5px;
  color: #333;
}

.detail-date {
  font-size: 0.9em;
  color: #777;
  margin-bottom: 15px;
}

.separator {
  border: 0;
  border-top: 1px solid #eee;
  margin: 15px 0;
}

.detail-full-text {
  font-size: 1em;
  color: #444;
  line-height: 1.6;
  text-align: left; /* Align transcript text left */
}

/* Style for each transcript segment */
.transcript-segment {
  margin-bottom: 12px;
}

.speaker-label {
  font-weight: bold;
  margin-right: 8px;
  /* color: #333; Color is now dynamic */
}

/* Add styles for the editable state */
.speaker-label.editable {
  cursor: pointer;
  padding-right: 5px; /* Add slight padding to indicate clickability */
  border-bottom: 1px dashed transparent; /* Underline on hover */
  transition: border-color 0.2s ease;
}
.speaker-label.editable:hover {
  border-bottom-color: currentColor; /* Use speaker color for underline */
}

/* Style for the input field */
.speaker-input {
  font-weight: bold;
  margin-right: 8px;
  border: 1px solid #ccc;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: inherit; /* Match surrounding text size */
  font-family: inherit;
  /* Optionally match color while editing, or keep it black */
  /* color: inherit; */ 
}

.segment-text {
  /* Style for the text itself if needed */
}

.loading, .error, .not-found {
  text-align: center;
  padding: 40px;
  color: #777;
}

.error {
  color: #dc3545;
}

.back-button {
  display: block;
  padding: 10px 20px;
  margin: 10px auto 0 auto; /* Center button at the bottom */
  cursor: pointer;
  border: 1px solid #ccc;
  background-color: #f8f8f8;
  border-radius: 4px;
  flex-shrink: 0; /* Prevent button from shrinking */
  color: #000; /* Set text color to black */
}

.back-button:hover {
  background-color: #eee;
}

.summary-section {
  margin-top: 20px;
  padding-top: 15px;
  /* border-top: 1px solid #eee; Optional separator */
}

.summarize-button {
  padding: 8px 15px;
  background-color: #17a2b8; /* Teal color */
  color: #000; /* Changed from white to black */
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.2s ease;
}

.summarize-button:hover:not(:disabled) {
  background-color: #138496;
}

.summarize-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.summary-error {
  margin-top: 10px;
  color: #dc3545; /* Error color */
  font-size: 0.9em;
}

.summary-result {
  margin-top: 15px;
  padding: 10px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  white-space: pre-wrap; /* Preserve line breaks in summary */
  text-align: left; /* Align summary text left */
}

.summary-result h3 {
    margin-top: 0;
    margin-bottom: 8px;
    font-size: 1.1em;
    font-weight: 600;
}

.summary-result p {
    margin: 0;
    font-size: 0.95em;
    line-height: 1.5;
}

.back-button {
  /* Adjust margin if needed to accommodate summary button */
  margin: 20px auto 0 auto; /* Increased top margin */
}
</style> 