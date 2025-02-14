// src/lib/websocket.js
export function createWebSocket(url, onMessage) {
    console.log("Creating WebSocket");
    const socket = new WebSocket(url);
  
    socket.addEventListener('open', () => {
      console.log('WebSocket connection established');
    });
  
    socket.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    });
  
    socket.addEventListener('close', () => {
      console.log('WebSocket connection closed');
    });
  
    socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
    });
  
    return {
      send: (message) => socket.send(JSON.stringify(message)),
      close: () => socket.close()
    };
  }