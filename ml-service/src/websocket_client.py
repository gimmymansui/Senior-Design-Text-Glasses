import asyncio
import websockets
import json
import time # Import time for sleep

# Added ping configuration constants
DEFAULT_PING_INTERVAL = 20   # Send a ping every 20 seconds
DEFAULT_PING_TIMEOUT = 10   # Wait 10 seconds for pong response

# Reconnection constants
INITIAL_RECONNECT_DELAY = 1.0 # seconds
MAX_RECONNECT_DELAY = 30.0    # seconds
RECONNECT_BACKOFF_FACTOR = 2.0

class WebSocketClient:
    def __init__(self, uri='ws://localhost:8080'):
        self.uri = uri
        self.websocket = None
        self.connected = False
        # Store config for reconnects if needed later
        self.ping_interval = DEFAULT_PING_INTERVAL
        self.ping_timeout = DEFAULT_PING_TIMEOUT
        self._reconnect_task = None # Task handle for background reconnection
        self._disconnect_requested = False # Flag to prevent reconnect on explicit close

    async def _reconnect(self):
        """Background task for attempting reconnections with exponential backoff."""
        delay = INITIAL_RECONNECT_DELAY
        while not self._disconnect_requested and not self.connected:
            print(f"Attempting to reconnect in {delay:.1f} seconds...")
            await asyncio.sleep(delay)
            if self._disconnect_requested: # Check again after sleep
                break
            try:
                # Use the main connect method
                await self.connect()
                if self.connected:
                    print("Reconnection successful.")
                    # Reset delay for next potential disconnect
                    delay = INITIAL_RECONNECT_DELAY
                    # If you had a receive loop, you might restart it here
                    # asyncio.create_task(self.receive_messages())
                    break # Exit reconnect loop on success
                else:
                     # Connection attempt failed, increase delay
                     print("Reconnect attempt failed.")
                     delay = min(delay * RECONNECT_BACKOFF_FACTOR, MAX_RECONNECT_DELAY)
            except Exception as e:
                print(f"Error during reconnect attempt: {e}")
                delay = min(delay * RECONNECT_BACKOFF_FACTOR, MAX_RECONNECT_DELAY)
        self._reconnect_task = None # Clear task handle when done

    def _schedule_reconnect(self):
        """Schedules the background reconnection task if not already running."""
        if not self._disconnect_requested and not self.connected and self._reconnect_task is None:
            print("Connection lost. Scheduling background reconnection.")
            self._reconnect_task = asyncio.create_task(self._reconnect())

    async def connect(self):
        """Connect to WebSocket server with keepalive pings enabled."""
        if self.connected and self.websocket and not self.websocket.closed:
            print("Already connected.")
            return True
        print(f"Attempting to connect to {self.uri} with ping interval {self.ping_interval}s, timeout {self.ping_timeout}s")
        try:
            # Ensure previous connection is properly closed if attempting reconnect
            if self.websocket and not self.websocket.closed:
                 await self.websocket.close()
            self.websocket = await websockets.connect(
                self.uri,
                ping_interval=self.ping_interval,
                ping_timeout=self.ping_timeout
            )
            self.connected = True
            print(f"Connected to WebSocket server at {self.uri}")
            # Start a task to listen for messages (optional, depending on if you need to receive)
            # asyncio.create_task(self.receive_messages())
            # Cancel any existing reconnect task since we are now connected
            if self._reconnect_task:
                self._reconnect_task.cancel()
                self._reconnect_task = None
            return True
        except websockets.exceptions.InvalidStatusCode as e:
             print(f"Connection failed: Invalid status code {e.status_code}")
             self.connected = False
             self.websocket = None
             return False
        except ConnectionRefusedError:
            print(f"Connection failed: Connection refused. Is the server running at {self.uri}?")
            self.connected = False
            self.websocket = None
            return False
        except Exception as e:
            print(f"Connection failed: {e}")
            self.connected = False
            self.websocket = None
            return False

    async def send_message(self, message):
        """Send message to WebSocket server, triggering reconnect if needed."""
        if not self.connected or not self.websocket:
            print("Send failed: Not connected.")
            self._schedule_reconnect() # Trigger background reconnect
            return False # Indicate send failure

        try:
            await self.websocket.send(json.dumps(message))
            return True
        except websockets.exceptions.ConnectionClosed as e:
            print(f"Failed to send message: Connection closed ({type(e).__name__} Code: {e.code}, Reason: {e.reason})")
            self.connected = False
            self.websocket = None
            self._schedule_reconnect() # Trigger background reconnect
            return False
        except Exception as e:
            print(f"Failed to send message due to other error: {e}")
            if self.websocket and not self.websocket.closed:
                 print("Connection seems open despite send error, investigate.")
            else:
                 print("Connection seems closed after send error.")
                 self.connected = False
                 self.websocket = None
            self._schedule_reconnect()
            return False

    async def receive_messages(self):
        """Receive messages from WebSocket server (example implementation)"""
        if not self.connected:
             print("Receive loop: Not connected, attempting connection.")
             if not await self.connect():
                 print("Receive loop: Connection failed, cannot receive.")
                 return

        while self.connected:
            if not self.websocket:
                 print("Receive loop: WebSocket object is None despite connected=True. Breaking.")
                 self.connected = False
                 break
            try:
                message = await self.websocket.recv()
                try:
                    data = json.loads(message)
                    print(f"Received: {data}")
                    # TODO: Handle the received message if needed
                except json.JSONDecodeError:
                    print(f"Received non-JSON message: {message}")
            except websockets.exceptions.ConnectionClosed as e:
                print(f"Receive loop: Connection closed ({type(e).__name__} Code: {e.code}, Reason: {e.reason})")
                self.connected = False
                self.websocket = None
                self._schedule_reconnect()
                break
            except Exception as e:
                print(f"Error receiving message: {e}")
                if isinstance(e, (GeneratorExit, asyncio.CancelledError)): raise
                self.connected = False
                self.websocket = None
                self._schedule_reconnect()
                break

    async def close(self):
        """Close WebSocket connection cleanly and prevent reconnection."""
        print("Close requested.")
        self._disconnect_requested = True # Signal to prevent reconnection attempts
        if self._reconnect_task:
            print("Cancelling pending reconnect task.")
            self._reconnect_task.cancel()
            try:
                await self._reconnect_task # Allow task to process cancellation
            except asyncio.CancelledError:
                pass # Expected
            finally:
                 self._reconnect_task = None

        if self.websocket and not self.websocket.closed:
             print("Closing WebSocket connection...")
             try:
                 await self.websocket.close()
             except Exception as e:
                  print(f"Error during explicit close: {e}") # Log error but continue cleanup
        elif self.websocket and self.websocket.closed:
             print("Connection already closed.")
        else:
            print("WebSocket object does not exist or already closed.")

        self.connected = False
        self.websocket = None
        print("WebSocket client closed.")