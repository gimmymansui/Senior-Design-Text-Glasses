<script>
  import NotificationBlock from "$lib/components/NotificationBlock.svelte";
  import SubtitlesBlock from "$lib/components/SubtitlesBlock.svelte";
  import WebSocketManager from "$lib/components/WebSocketManager.svelte";
  import { subtitlesStore, addSubtitle } from "$lib/subtitles";
  import { notificationStore, addNotification } from "$lib/notification";
  import { isRecording, toggleRecording, setRecording } from "$lib/record";
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
    <div class="recording-signal {isRecording() ? 'on' : 'off'}"></div>
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
</style>
