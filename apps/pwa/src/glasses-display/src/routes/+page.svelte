<script>
  import NotificationBlock from "$lib/components/NotificationBlock.svelte";
  import SubtitlesBlock from "$lib/components/SubtitlesBlock.svelte";
  import WebSocketManager from "$lib/components/WebSocketManager.svelte";
  import { subtitlesStore, addSubtitle } from "$lib/subtitles";
  import { notificationStore, addNotification } from "$lib/notification";
  import { isRecording, toggleRecording, recordingStatus } from "$lib/record";
  
  // Format seconds to MM:SS
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
</script>

<WebSocketManager />

<section class="display-wrapper">
  <div class="content-wrapper">
    {#each $notificationStore as { header, message, isPrevious }}
      <NotificationBlock
        {header}
        {message}
        {isPrevious}
      />
    {/each}
    
    <div class="recording-container">
      {#if $isRecording}
        <div class="recording-timer">{formatTime($recordingStatus.duration)}</div>
      {/if}
      <div class="recording-signal {$isRecording ? 'on' : 'off'}"></div>
    </div>
    
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
  
  .recording-container {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    inset: 0% 0% auto auto;
  }
  
  .recording-timer {
    color: #e13131;
    font-size: 16px;
    font-weight: bold;
    margin-right: 5px;
  }
  
  /* Adjust the recording-signal position to work within the container */
  :global(.recording-signal) {
    position: relative;
    inset: unset;
  }
</style>
