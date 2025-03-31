<script>
  import { createEventDispatcher } from 'svelte';
  import { subtitlesStore } from "$lib/subtitles";
  
  const dispatch = createEventDispatcher();
  let socket;
  let isRecording = false;
  
  // Connect to WebSocket server on your IoT device
  function connectWebSocket() {
    // Replace with your device's IP or hostname
    socket = new WebSocket('ws://your-iot-device-ip:port');
    
    socket.onopen = () => {
      console.log('WebSocket connected');
    };
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'subtitle') {
        // Add to subtitle store
        const newSubtitle = {
          speakerName: data.speakerName || 'Speaker',
          text: data.text,
          isPrevious: false,
          timestamp: new Date().toISOString()
        };
        
        subtitlesStore.update(subtitles => {
          // Mark previous subtitles
          const updatedSubtitles = subtitles.map(sub => ({
            ...sub,
            isPrevious: true
          }));
          
          // Add new subtitle and limit to last 3
          return [...updatedSubtitles, newSubtitle].slice(-3);
        });
        
        // Also dispatch for any components listening directly
        dispatch('newSubtitle', newSubtitle);
      } 
      else if (data.type === 'recordingState') {
        isRecording = data.isRecording;
        dispatch('recordingStateChange', { isRecording });
      }
    };
    
    socket.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect after delay
      setTimeout(connectWebSocket, 3000);
    };
  }
  
  // Start recording function to send to IoT device
  export function startRecording() {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ command: 'startRecording' }));
    }
  }
  
  // Stop recording function to send to IoT device
  export function stopRecording() {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ command: 'stopRecording' }));
    }
  }
  
  // Save current transcript to browser storage
  export function saveTranscript() {
    const transcript = get(subtitlesStore);
    const savedTranscripts = JSON.parse(localStorage.getItem('savedTranscripts') || '[]');
    
    const newSavedTranscript = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      subtitles: transcript
    };
    
    savedTranscripts.push(newSavedTranscript);
    localStorage.setItem('savedTranscripts', JSON.stringify(savedTranscripts));
    
    // Notify IoT device that transcript was saved
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ command: 'transcriptSaved', id: newSavedTranscript.id }));
    }
    
    dispatch('transcriptSaved', newSavedTranscript);
  }
  
  // Connect when component is mounted
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  
  onMount(() => {
    connectWebSocket();
  });
  
  onDestroy(() => {
    if (socket) {
      socket.close();
    }
  });
</script>

<div>
  {#if isRecording}
    <div class="recording-indicator">Recording...</div>
  {/if}
</div> 