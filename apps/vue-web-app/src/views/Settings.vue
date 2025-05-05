<template>
  <div class="container-page">
    <div class="settings-title">Settings</div>

    <div class="settings-section">
        <h3>Display Settings</h3>
        <div class="setting-item">
            <span>Color Blind Mode</span>
            <label class="color-blind-switch">
                <!-- TODO: Bind checked to Vue state -->
                <input type="checkbox" id="colorBlindToggle">
                <span class="color-blind-slider"></span>
            </label>
        </div>
        <div class="setting-item">
            <span>Funky Mode</span>
            <label class="funky-switch">
                 <!-- TODO: Bind checked to Vue state -->
                <input type="checkbox" id="funkyToggle">
                <span class="funky-slider"></span>
            </label>
        </div>
        <div class="setting-item">
            <span>Font Size</span>
            <!-- TODO: Bind selected value to Vue state -->
            <select>
                <option>Small</option>
                <option selected>Medium</option>
                <option>Large</option>
            </select>
        </div>
    </div>

    <div class="settings-section">
        <h3>Transcription Settings</h3>
        <div class="setting-item">
            <span>Auto Transcribe</span>
            <label class="switch">
                 <!-- TODO: Bind checked to Vue state -->
                <input type="checkbox" checked>
                <span class="slider"></span>
            </label>
        </div>
        <div class="setting-item">
            <span>Language</span>
            <!-- TODO: Bind selected value to Vue state -->
            <select>
                <option selected>English (US)</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
            </select>
        </div>
        <div class="setting-item">
            <span>Transcription Quality</span>
             <!-- TODO: Bind selected value to Vue state -->
            <select>
                <option>Low (Faster)</option>
                <option selected>Medium</option>
                <option>High (More Accurate)</option>
            </select>
        </div>
    </div>

    <button class="return-button" @click="goHome">Return to Home</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
// TODO: Import refs for managing setting states

const router = useRouter();

function goHome() {
    router.push('/');
}

// TODO: Add refs and methods to handle changes to settings
// Example:
// const colorBlindMode = ref(false);
// const fontSize = ref('Medium');

</script>

<style scoped>
/* Copy relevant styles from pages.css and style.css for .container-page,
   .settings-title, .settings-section, .setting-item, switches, selects, etc. */

.container-page {
  padding: 20px;
  max-width: 600px; /* Adjust as needed */
  margin: 20px auto;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.settings-title {
  font-size: 1.8em;
  font-weight: bold;
  margin-bottom: 30px;
  text-align: center;
  color: #333;
}

.settings-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}
.settings-section:last-of-type {
    border-bottom: none;
}

.settings-section h3 {
  font-size: 1.3em;
  margin-bottom: 15px;
  color: #555;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.setting-item span:first-child {
  color: #444;
  font-weight: 500;
}

/* Basic Switch Styles (adapt from your style.css/pages.css) */
.switch, .color-blind-switch, .funky-switch {
  position: relative;
  display: inline-block;
  width: 50px; /* Adjust size */
  height: 24px; /* Adjust size */
}

.switch input, .color-blind-switch input, .funky-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider, .color-blind-slider, .funky-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px; /* Adjust size */
}

.slider:before, .color-blind-slider:before, .funky-slider:before {
  position: absolute;
  content: "";
  height: 18px; /* Adjust size */
  width: 18px; /* Adjust size */
  left: 3px; /* Adjust position */
  bottom: 3px; /* Adjust position */
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider, input:checked + .color-blind-slider, input:checked + .funky-slider {
  background-color: #2196F3; /* Or your theme color */
}

input:checked + .slider:before, input:checked + .color-blind-slider:before, input:checked + .funky-slider:before {
  transform: translateX(26px); /* Adjust distance based on width */
}

/* Select Styles (adapt) */
select {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: white;
  color: #333; /* Explicitly set dark text color */
}

.return-button {
    display: block;
    margin: 20px auto 0;
    padding: 10px 20px;
    cursor: pointer;
}

</style> 