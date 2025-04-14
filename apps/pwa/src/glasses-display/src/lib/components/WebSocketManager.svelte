<script>
    import { onMount } from "svelte";
    import { createWebSocketConnection } from "$lib/websocket";
    import { addSubtitle } from "$lib/subtitles";
    import { addNotification } from "$lib/notification";
    import { toggleRecording, setRecording } from "$lib/record";
    import { websocketConnection } from "$lib/stores/websocket-store";

    const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8080";

    onMount(() => {
      console.log('Mounting WebSocket manager');
      const messageHandler = {
        onSubtitles: (data) => {
          addSubtitle({
            speakerName: data.speakerName || "Unknown Speaker",
            text: data.text || "",
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
        },
        // Add handler for transfer status responses
        onTransferStatus: (data) => {
          console.log('Transfer status:', data.status);
          if (data.status === 'failed') {
            console.error('Transfer failed:', data.error);
          }
        }
      };

      const connection = createWebSocketConnection(WS_URL, messageHandler);
      websocketConnection.set(connection);
      
      return () => {
        connection.close();
        websocketConnection.set(null);
      };
    });
    
    // Export a function to send messages through the WebSocket
    export function sendMessage(message) {
      websocketConnection.subscribe(conn => {
        if (conn && conn.ws && conn.ws.readyState === WebSocket.OPEN) {
          conn.ws.send(JSON.stringify(message));
        } else {
          console.error('WebSocket not connected');
        }
      })();
    }
</script>
