<!-- src/lib/components/SubtitlesContent.svelte -->
<script>
  import { onMount } from "svelte";
  import { createWebSocketServer } from "$lib/websocket";
  
  export let speakerName;
  export let text;
  export let isPrevious;

  // Create a custom event dispatcher to send updates to the parent
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  onMount(() => {
    const wsUrl = "ws://localhost:5173/ws";

    const handleMessage = (message) => {
      // Parse the incoming message
      const data = JSON.parse(message);

      // Dispatch the new subtitle data to the parent
      dispatch('newSubtitle', {
        speakerName: data.speakerName || "Unknown Speaker",
        text: data.text || "",
        isPrevious: false
      });
    };

    const { close } = createWebSocketServer(wsUrl, handleMessage);

    return () => {
      close();
    };
  });
</script>

<div class="subtitles-content {isPrevious ? 'previous' : ''}">
  <h1 class="speaker-name">{speakerName}</h1>
  <div class="dividing-line"></div>
  <p class="subtitle-text">{text}</p>
</div>

<style>
  
</style>
