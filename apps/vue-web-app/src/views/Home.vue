<!-- apps/vue-web-app/src/views/Home.vue -->
<template>
  <div class="home-container">
    <!-- Hero Section: Large Central Button -->
    <div class="hero-section">
      <!-- Welcome Message -->
      <div v-if="currentUser" class="welcome-message">
        Welcome, {{ currentUser.displayName || 'User' }}
      </div>
      <!-- Login Prompt Message -->
      <div v-else class="login-prompt-message">
        Please login for full functionality
      </div>
      
      <button class="start-button" @click="startRecording" :disabled="!isConnected">
          <!-- Consider using an actual record icon instead of text -->
          <span>REC</span>
      </button>
    </div>

    <!-- Content Area Below Button -->
    <div class="content-area">
      <!-- Bluetooth Controls -->
      <div class="bento-box bluetooth-box">
         <h3>Connectivity</h3>
         <div class="bluetooth-container">
            <div class="bluetooth-status">
                <span 
                    class="material-symbols-outlined bluetooth-icon" 
                    :class="{ connected: isConnected, error: connectionError, connecting: isConnecting }"
                >
                    bluetooth
                </span>
            </div>
            <button class="bluetooth-button connect-btn" v-if="!isConnected && !isConnecting" @click="connectToDevice">
                Connect
            </button>
            <button class="bluetooth-button disconnect-btn" v-if="isConnected" @click="disconnectFromDevice">
                Disconnect
            </button>
            <p v-if="connectionError" class="error-detail">{{ connectionError }}</p>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useBluetooth } from '../composables/useBluetooth';
import { useAuth } from '../composables/useAuth';

// Get Bluetooth reactive state and methods
const {
    isConnected,
    isConnecting,
    connectionError,
    connectedDevice,
    connect,
    disconnect,
    sendRecordCommand,
    clearError
} = useBluetooth();

// Get Auth state (needed for conditional transcription link)
const { currentUser } = useAuth();

const router = useRouter();

// --- Bluetooth Actions ---
async function connectToDevice() {
    if (connectionError.value) {
        clearError();
    }
    await connect();
}
async function disconnectFromDevice() {
    await disconnect();
}
async function startRecording() {
    if(isConnected.value) {
         console.log("Requesting recording start...");
         await sendRecordCommand();
    } else {
        console.warn("Cannot start recording: Not connected.");
    }
}

// Removed handleSignOut as it's now in App.vue

</script>

<style scoped>
.home-container {
  /* Container for the whole view */
  padding-bottom: 10px; /* Add padding at the bottom */
}

/* Hero Section Styles */
.hero-section {
  padding: 10px; /* More top padding, less bottom */
  text-align: center;
  /* margin-bottom removed, handled by content-area padding */
}

/* Welcome Message Styles */
.welcome-message {
  font-size: 1.1em;
  color: #555;
  margin-bottom: 15px; /* Space between message and button */
  font-weight: 500;
}

/* Login Prompt Styles */
.login-prompt-message {
  font-size: 1.0em; /* Slightly smaller or same size */
  color: #6c757d; /* Muted color */
  margin-bottom: 15px; /* Space between message and button */
  font-style: italic;
}

.start-button {
    width: 40vh; /* MUCH larger circle */
    height: 40vh; /* MUCH larger circle */
    padding: 0;
    font-size: 1.8em; /* Larger font */
    font-weight: bold;
    cursor: pointer;
    border: none;
    border-radius: 50%;
    background: linear-gradient(145deg, #007bff, #0056b3); /* Gradient */
    color: white;
    transition: background-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    box-shadow: 0 8px 20px rgba(0, 123, 255, 0.35); /* More prominent shadow */
    line-height: 1.2;
}

.start-button > span {
    display: block;
}

.start-button:hover:not(:disabled) {
    background: linear-gradient(145deg, #0069d9, #004085); /* Darker gradient */
    box-shadow: 0 10px 25px rgba(0, 123, 255, 0.45);
    transform: scale(1.03); /* Slight scale up on hover */
}

.start-button:active:not(:disabled) {
    background: linear-gradient(145deg, #0056b3, #003366); /* Even darker gradient */
    transform: scale(0.97); /* Scale down on press */
    box-shadow: 0 5px 15px rgba(0, 123, 255, 0.3);
}

.start-button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    background: #6c757d; /* Flat disabled color */
    box-shadow: none;
    transform: scale(1); /* No transform when disabled */
}

/* Content Area Below Button */
.content-area {
  padding-top: 10px; /* Add some space above the first box */
}

/* Remove Bento Grid Layout */
/* .bento-layout { ... } REMOVED */

/* Style Boxes for Vertical Stacking */
.bento-box {
  border-radius: 12px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: auto; /* Keep boxes full width of content-area */
}

/* Specific Box Adjustments */
.bluetooth-box {
  /* padding remains reduced */
  padding: 12px 15px;
}

.nav-box {
  /* Adjust nav-box specific styles if needed */
  min-height: auto; /* Remove min-height */
  padding: 10px;
  gap: 15px; /* Adjust gap between items if needed */
}

/* --- Box Content Styles --- */

/* Bluetooth Box */
.bluetooth-box h3 {
    margin-top: 0;
    margin-bottom: 10px; /* Add some space below heading */
    font-size: 1.0em;
    color: #555;
    text-align: center;
}
.bluetooth-container {
    display: flex;
    flex-direction: column; /* Stack items vertically */
    align-items: center; /* Center items horizontally */
    justify-content: center; /* Center items vertically if needed */
    gap: 8px; /* Add vertical gap between icon and button */
}
.bluetooth-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px; /* Space between icon and text */
    min-height: 28px; /* Ensure consistent height */
    font-weight: 500;
}

/* Style for the Bluetooth icon */
.bluetooth-icon {
    font-size: 28px; /* Make icon larger */
    color: #6c757d; /* Default grey color */
    transition: color 0.3s ease;
    font-family: 'Material Symbols Outlined'; /* Ensure font is applied */
    vertical-align: middle; /* Align icon nicely with text */
}

/* Style for the icon when connected */
.bluetooth-icon.connected {
    color: #007bff; /* Blue color */
}

/* Style for the icon when there is an error */
.bluetooth-icon.error {
    color: #dc3545; /* Red color */
}

/* Style for the icon when connecting */
.bluetooth-icon.connecting {
    opacity: 0.6;
    animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Pulse animation keyframes */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}

/* Styles for status text */
.connected-device-name,
.error-text,
.connecting-text {
    font-size: 0.9em;
}

.error-text {
    color: #dc3545; /* Red for error */
    font-weight: 500;
}

.bluetooth-button {
    padding: 8px 16px;
    min-width: 100px; /* Example minimum width */
    border: none;
    border-radius: 6px; /* Less rounded */
    cursor: pointer;
    font-size: 0.9em; /* Smaller font */
    font-weight: 500;
    transition: background-color 0.2s ease;
}
.error-detail {
    font-size: 0.8em;
}

/* Navigation Box Styles */
.nav-box {
    align-items: stretch;
    flex-direction: row; /* Keep items horizontal */
    flex-wrap: wrap;
    justify-content: space-around;
}

.nav-item {
    /* Styles remain largely the same */
}

.nav-icon {
    font-size: 2.0em;
    margin-bottom: 5px;
}

.nav-text {
    font-size: 0.8em;
    font-weight: 500;
}
.nav-item.disabled .nav-text {
    /* Potentially wrap text */
}

/* Remove media query related to grid */
/* @media (max-width: 480px) { ... } REMOVED */

</style> 