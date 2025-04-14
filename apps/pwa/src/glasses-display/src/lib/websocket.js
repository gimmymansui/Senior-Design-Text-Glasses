// src/lib/websocket.js
export const createWebSocketConnection = (url, messageHandler) => {
    console.log('Creating WebSocket connection to:', url);
    
    const ws = new WebSocket(url);

    ws.onopen = () => {
        console.log('WebSocket connection established');
    };

    ws.onmessage = (event) => {
        console.log('WebSocket message received, type:', typeof event.data);
        console.log('WebSocket message content:', event.data);
        
        try {
            const data = JSON.parse(event.data);
            console.log('Parsed data:', data);
            
            if (data.type === 'notification' && typeof messageHandler.onNotification === 'function') {
                messageHandler.onNotification(data);
            } else if (data.type === 'subtitles' && typeof messageHandler.onSubtitles === 'function') {
                messageHandler.onSubtitles(data);
            } else if (data.type === 'record' && typeof messageHandler.onRecord === 'function') {
                messageHandler.onRecord(data);
            } else if (data.type === 'transfer_status' && typeof messageHandler.onTransferStatus === 'function') {
                messageHandler.onTransferStatus(data);
            } else if (data.type === 'record_data') {
                console.log('Received record data');
                // No handler needed as this is likely sent from this client to the server
            } else {
                console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            console.error('Raw message:', event.data);
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
        console.log('WebSocket connection closed');
    };

    return {
        close: () => {
            ws.close();
        },
        ws: ws,  // Return the WebSocket instance
        sendMessage: (message) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
                return true;
            }
            return false;
        }
    };
}
