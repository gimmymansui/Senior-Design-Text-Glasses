<!-- src/lib/components/SubtitlesContent.svelte -->
<script>
  export let speakerName;
  export let text;
  export let isPrevious;
</script>

<div class="subtitles-content {isPrevious ? 'previous' : ''}">
  <h1 class="speaker-name">{speakerName}</h1>
  <div class="dividing-line"></div>
  <p class="subtitle-text">{text}</p>
</div>

<style>
  
</style>
