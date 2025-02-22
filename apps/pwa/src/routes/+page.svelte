<script>
  import NotificationBlock from "$lib/components/NotificationBlock.svelte";
  import SubtitlesBlock from "$lib/components/SubtitlesBlock.svelte";

  let subtitles = [];

  function handleNewSubtitle(event) {
    const newSubtitle = event.detail;
    
    // Mark previous subtitles as "previous"
    if (subtitles.length > 0) {
      subtitles = subtitles.map(subtitle => ({
        ...subtitle,
        isPrevious: true
      }));
    }

    // Add new subtitle to the array
    subtitles = [...subtitles, newSubtitle];

    // Limit the number of visible subtitles
    if (subtitles.length > 3) {
      subtitles = subtitles.slice(-3);
    }
  }
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
        <SubtitlesBlock 
          {speakerName} 
          {text} 
          {isPrevious}
          on:newSubtitle={handleNewSubtitle}
        />
      {/each}
    </div>
  </div>
</section> 