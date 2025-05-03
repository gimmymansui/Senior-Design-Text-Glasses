// src/lib/websocket.js
export const createWebSocketConnection = (url, messageHandler) => {
    console.log('Creating WebSocket connection to:', url);
    
    const ws = new WebSocket(url);

    ws.onopen = () => {
        console.log('WebSocket connection established');
    };

    ws.onmessage = (event) => {
        console.log('WebSocket message received, type:', typeof event.data);
        
        try {
            const data = JSON.parse(event.data);
            
            // LOCAL PROCESSING ONLY - process all messages for UI display
            if (data.type === 'notification' && typeof messageHandler.onNotification === 'function') {
                messageHandler.onNotification(data);
            } else if (data.type === 'subtitles' && typeof messageHandler.onSubtitles === 'function') {
                messageHandler.onSubtitles(data);
            } else if (data.type === 'record' && typeof messageHandler.onRecord === 'function') {
                messageHandler.onRecord(data);
            } else if (data.type === 'transfer_status' && typeof messageHandler.onTransferStatus === 'function') {
                messageHandler.onTransferStatus(data);
            } else if (data.type === 'record_data') {
                console.log('Received record data message');
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

    // Return connection object with sendMessage method
    return {
        ws,
        sendMessage: (message) => {
            if (ws.readyState === WebSocket.OPEN) {
                // CRITICAL: Only send record_data messages to the bluetooth bridge
                // This is where we filter what goes to the bluetooth bridge
                if (message.type === 'record_data' && message.command === 'send_conversation') {
                    console.log('Sending recorded conversation to bluetooth bridge');
                    ws.send(JSON.stringify(message));
                } 
                // Allow specific control messages to pass through
                else if (message.type === 'record') {
                    console.log('Sending record command');
                    ws.send(JSON.stringify(message));
                }
                // Block all other message types from being sent to the bridge
                else {
                    console.log('Blocking message type from bluetooth bridge:', message.type);
                }
            } else {
                console.error('WebSocket not connected');
            }
        },
        close: () => {
            if (ws.readyState !== WebSocket.CLOSED) {
                ws.close();
            }
        }
    };
};
