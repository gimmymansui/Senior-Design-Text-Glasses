<script>
  import NotificationBlock from "$lib/components/NotificationBlock.svelte";
  import SubtitlesBlock from "$lib/components/SubtitlesBlock.svelte";
  import { createWebSocket } from "$lib/websocket";
  import { onMount } from "svelte";

  let subtitles = [];

  onMount(() => {
    console.log("Mounting");
    const { close } = createWebSocket(
      "ws://localhost:5173/ws",
      (data) => {
        subtitles = data; // Update subtitles array
      }
    );

    return () => {
      close();
    };
  });
</script>

<section class="display-wrapper">
  <div class="content-wrapper">
    <NotificationBlock
      title="NOISY"
      message="Transcription quality may suffer in a noisy environment."
    />
    <NotificationBlock
      title="Conversation saved!"
      message="See the saved conversation transcript in the phone app."
    />
    <div class="recording-signal off"></div>
    <div class="subtitles-wrapper">
      {#each subtitles as { speakerName, text, isPrevious }}
        <SubtitlesBlock {speakerName} {text} {isPrevious} />
      {/each}
    </div>
  </div>
</section>

<style>
  @import "../normalize.css";
  @import "../webflow.css";
  @import "../frontend-glasses.webflow.css";
</style>
