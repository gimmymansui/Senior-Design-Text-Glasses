<script>
    import { onMount } from "svelte";
    import { createWebSocketConnection } from "$lib/websocket";
    import { addSubtitle } from "$lib/subtitles";
    import { addNotification } from "$lib/notification";
    import { toggleRecording, setRecording } from "$lib/record";
  
    const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8080";
  
    onMount(() => {
      console.log('Mounting WebSocket manager');
      const messageHandler = {
        onSubtitles: (data) => {
          addSubtitle({
            speakerName: data.speakerName || "Unknown Speaker",
            text: data.text || "",
            isPartial: data.isPartial || false,
            sentenceId: data.sentenceId || Date.now()
          });
        },

        onNotification: (data) => {
          addNotification({
            header: data.header || "Notification",
            message: data.message || ""
          })
        },

        onRecord: (data) => {
          toggleRecording();
          console.log("Record switch triggered: Recording...")
        }
      };
  
      const { close } = createWebSocketConnection(WS_URL, messageHandler);
      return close;
    });
  
</script>