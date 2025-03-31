<script>
    import { onMount, createEventDispatcher } from "svelte";
    import { createWebSocketConnection } from "$lib/websocket";
    import { addSubtitle } from "$lib/subtitles";
    import { addNotification } from "$lib/notification";
    import { toggleRecording, setRecording } from "$lib/record";
    import { saveTranscription } from "$lib/storage";

  
    const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8080";
    const dispatch = createEventDispatcher();
    let webSocket;
  
    onMount(() => {
      console.log('Mounting WebSocket manager');

      const messageHandler = (data) => {
        // Handle different message types
        if (data.type === 'subtitles') {
          addSubtitle({
            speakerName: data.speakerName || "Unknown Speaker",
            text: data.text || "",
            isPartial: data.isPartial || false,
            sentenceId: data.sentenceId || Date.now()
          });
          
          // Dispatch event for components listening directly
          dispatch('newSubtitle', {
            speakerName: data.speakerName || "Unknown Speaker",
            text: data.text || "",
            sentenceId: data.sentenceId || Date.now()
          });
        } 
        else if (data.type === 'notification') {
          addNotification({
            header: data.header || "Notification",
            message: data.message || ""
          });
        }
        else if (data.type === 'record') {
          toggleRecording();
          console.log("Record switch triggered: Recording...");
          
          // Dispatch recording state change
          dispatch('recordingStateChange', { isRecording: true });
        }
        else if (data.type === 'save') {
          // Save the current transcription
          saveTranscription(data.conversationName || "Unnamed Conversation");
          addNotification({
            header: "Conversation Saved",
            message: `Saved as "${data.conversationName || 'Unnamed Conversation'}"`
          });
          
          // Dispatch transcript saved event
          dispatch('transcriptSaved');
        }
      };
  
      const { close, ws } = createWebSocketConnection(WS_URL, messageHandler);
      webSocket = ws;
      return close;
    });
    
    // Export functions to control recording from parent components
    export function startRecording() {
      if (webSocket && webSocket.readyState === WebSocket.OPEN) {
        webSocket.send(JSON.stringify({ command: 'startRecording' }));
      }
    }
    
    export function stopRecording() {
      if (webSocket && webSocket.readyState === WebSocket.OPEN) {
        webSocket.send(JSON.stringify({ command: 'stopRecording' }));
      }
    }
    
    export function saveTranscript() {
      if (webSocket && webSocket.readyState === WebSocket.OPEN) {
        webSocket.send(JSON.stringify({ command: 'saveTranscript' }));
      }
    }
</script>