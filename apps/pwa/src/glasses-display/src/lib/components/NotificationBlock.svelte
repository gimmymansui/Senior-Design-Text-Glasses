   <!-- src/lib/components/NotificationBlock.svelte -->
   <script>
    export let header;
    export let message;
  </script>

  <div class="notification-block">
    <div class="dividing-line vertical"></div>
    <div class="notification-wrapper">
      <h1 class="notification-title">{header}</h1>
      <p class="notification-message">{message}</p>
    </div>
  </div>

  <style>
    /* Add any specific styles for the notification block here */
  </style>