import bluetooth
import json
import threading
import websocket
from vosk_speech_model import AudioTranscriber  # Import your existing transcriber

class BluetoothBridge:
    def __init__(self):
        # Initialize Bluetooth server
        self.server_sock = bluetooth.BluetoothSocket(bluetooth.RFCOMM)
        self.server_sock.bind(("", bluetooth.PORT_ANY))
        self.server_sock.listen(1)
        self.port = self.server_sock.getsockname()[1]
        
        # Service UUID - match with your webapp
        self.uuid = "94f39d29-7d6d-437d-973b-fba39e49d4ee"
        
        # Initialize transcriber
        self.transcriber = AudioTranscriber()
        
        # WebSocket connection to your server
        self.ws = None
        self.ws_url = "ws://localhost:8080"

    def start_advertising(self):
        bluetooth.advertise_service(
            self.server_sock,
            "SpeechTranscriptionService",
            service_id=self.uuid,
            service_classes=[self.uuid, bluetooth.SERIAL_PORT_CLASS],
            profiles=[bluetooth.SERIAL_PORT_PROFILE]
        )
        print(f"Advertising Bluetooth service on RFCOMM channel {self.port}")

    def handle_websocket_message(self, ws, message):
        try:
            data = json.loads(message)
            if data.get('type') == 'record':
                # Toggle recording state
                if not self.transcriber.is_running:
                    print("Starting recording...")
                    self.transcriber.is_running = True
                else:
                    print("Stopping recording...")
                    self.transcriber.is_running = False
                
                # Send acknowledgment back through WebSocket
                response = {
                    'type': 'recordingStatus',
                    'status': 'recording' if self.transcriber.is_running else 'stopped'
                }
                ws.send(json.dumps(response))
                
        except json.JSONDecodeError:
            print(f"Invalid JSON message received: {message}")
        except Exception as e:
            print(f"Error handling WebSocket message: {e}")

    def connect_websocket(self):
        def on_message(ws, message):
            self.handle_websocket_message(ws, message)

        def on_error(ws, error):
            print(f"WebSocket error: {error}")

        def on_close(ws, close_status_code, close_msg):
            print("WebSocket connection closed")
            # Attempt to reconnect after delay
            threading.Timer(5.0, self.connect_websocket).start()

        def on_open(ws):
            print("WebSocket connection established")

        # Create WebSocket connection
        self.ws = websocket.WebSocketApp(
            self.ws_url,
            on_message=on_message,
            on_error=on_error,
            on_close=on_close,
            on_open=on_open
        )
        
        # Start WebSocket connection in a separate thread
        ws_thread = threading.Thread(target=self.ws.run_forever)
        ws_thread.daemon = True
        ws_thread.start()

    def run(self):
        try:
            # Start WebSocket connection
            self.connect_websocket()
            
            # Start Bluetooth advertising
            self.start_advertising()
            
            print("Bluetooth bridge running. Waiting for connections...")
            
            while True:
                # Accept Bluetooth connections but don't do anything with them
                # We're only using Bluetooth for discovery
                client_sock, client_info = self.server_sock.accept()
                print(f"Accepted connection from {client_info}")
                client_sock.close()
                
        except KeyboardInterrupt:
            print("\nShutting down...")
        finally:
            if self.server_sock:
                self.server_sock.close()
            if self.ws:
                self.ws.close()

if __name__ == "__main__":
    bridge = BluetoothBridge()
    bridge.run()