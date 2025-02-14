// src/lib/websocket.js
import { WebSocket } from 'ws';

export function createWebSocketServer(url, onMessage) {
    const wss = new WebSocket.Server({ port: 5173 });
  
    wss.on('connection', (ws) => {
      ws.on('message', (message) => {
        console.log('WebSocket message received:', message);

        if (typeof onMessage === 'function') {
            console.log('Calling onMessage');
            onMessage(message);
        }
      });
      ws.on('close', () => {
        console.log('WebSocket connection closed');
      });
    });

    return {
      send: (message) => wss.clients.forEach(client => client.send(message))
    };
  }
