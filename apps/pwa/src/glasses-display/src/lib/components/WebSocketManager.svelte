<script>
    import { onMount } from "svelte";
    import { createWebSocketConnection } from "$lib/websocket";
    import { addSubtitle } from "$lib/subtitles";
  
    const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8080";
  
    onMount(() => {
      console.log('Mounting WebSocket manager');
      const handleMessage = (data) => {
        addSubtitle({
          speakerName: data.speakerName || "Unknown Speaker",
          text: data.text || ""
        });
      };
  
      const { close } = createWebSocketConnection(WS_URL, handleMessage);
      return close;
    });
  </script>