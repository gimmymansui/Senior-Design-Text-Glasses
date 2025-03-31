<script>
  import NotificationBlock from "$lib/components/NotificationBlock.svelte";
  import SubtitlesBlock from "$lib/components/SubtitlesBlock.svelte";
  import WebSocketManager from "$lib/components/WebSocketManager.svelte";
  import { subtitlesStore } from "$lib/subtitles";
  import { onMount } from 'svelte';

  let webSocketManager;
  let isRecording = false;
  let showSavedNotification = false;

  function handleNewSubtitle(event) {
    // You can keep this or remove it since we're now using the store
    const newSubtitle = event.detail;
    // ... existing code ...
  }
  
  function handleRecordingStateChange(event) {
    isRecording = event.detail.isRecording;
  }
  
  function handleTranscriptSaved() {
    showSavedNotification = true;
    setTimeout(() => {
      showSavedNotification = false;
    }, 3000);
  }
  
  // These functions could be called from your phone app via WebSocket
  function startRecording() {
    webSocketManager.startRecording();
  }
  
  function stopRecording() {
    webSocketManager.stopRecording();
  }
  
  function saveTranscript() {
    webSocketManager.saveTranscript();
  }
</script>

<WebSocketManager 
  bind:this={webSocketManager}
  on:newSubtitle={handleNewSubtitle}
  on:recordingStateChange={handleRecordingStateChange}
  on:transcriptSaved={handleTranscriptSaved}
/>

<section class="display-wrapper">
  <div class="content-wrapper">
    <NotificationBlock
      title="NOISY"
      message="Transcription quality may suffer in a noisy environment."
    />
    {#if showSavedNotification}
      <NotificationBlock
        title="Conversation saved!"
        message="See the saved conversation transcript in the phone app."
      />
    {/if}
    <div class="recording-signal {isRecording ? 'on' : 'off'}"></div>
    <div class="subtitles-wrapper">
      {#each $subtitlesStore as { speakerName, text, isPrevious }}
        <SubtitlesBlock     
          {speakerName} 
          {text} 
          {isPrevious}
        />
      {/each}
    </div>
  </div>
</section>

<style>
  @import "../normalize.css";
  @import "../webflow.css";
  @import "../frontend-glasses.webflow.css";
  
  .recording-signal.on {
    background-color: red;
    animation: pulse 1.5s infinite;
  }
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
</style> 