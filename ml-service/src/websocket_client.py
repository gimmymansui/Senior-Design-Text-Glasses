import asyncio
import websockets
import json

class WebSocketClient:
    def __init__(self, uri='ws://localhost:8080'):
        self.uri = uri
        self.websocket = None
        self.connected = False

    async def connect(self):
        """Connect to WebSocket server"""
        try:
            self.websocket = await websockets.connect(self.uri)
            self.connected = True
            print(f"Connected to WebSocket server at {self.uri}")
            return True
        except Exception as e:
            print(f"Connection failed: {e}")
            return False

    async def send_message(self, message):
        """Send message to WebSocket server"""
        if not self.connected:
            await self.connect()
        try:
            await self.websocket.send(json.dumps(message))
            return True
        except Exception as e:
            print(f"Failed to send message: {e}")
            self.connected = False
            return False

    async def receive_messages(self):
        """Receive messages from WebSocket server"""
        if not self.connected:
            await self.connect()
        try:
            while True:
                message = await self.websocket.recv()
                try:
                    data = json.loads(message)
                    print(f"Received: {data}")
                    # Handle the message here
                except json.JSONDecodeError:
                    print(f"Received non-JSON message: {message}")
        except websockets.exceptions.ConnectionClosed:
            print("Connection closed")
            self.connected = False
        except Exception as e:
            print(f"Error receiving message: {e}")
            self.connected = False

    async def close(self):
        """Close WebSocket connection"""
        if self.websocket:
            await self.websocket.close()
            self.connected = False
            print("Connection closed")