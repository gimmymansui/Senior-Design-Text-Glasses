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
        }
    };
}
