import bluetooth
import socket
import json
import threading
import requests
import websocket

# WebSocket URL (same as in your WebSocketManager.svelte)www
WS_URL = "ws://localhost:8080"

# Set up Bluetooth server socket
server_sock = bluetooth.BluetoothSocket(bluetooth.RFCOMM)
server_sock.bind(("", bluetooth.PORT_ANY))
server_sock.listen(1)

port = server_sock.getsockname()[1]

# Advertise the service
uuid = "94f39d29-7d6d-437d-973b-fba39e49d4ee"  # Generate a unique UUID
bluetooth.advertise_service(
    server_sock, 
    "SpeechTranscriptionService",
    service_id=uuid,
    service_classes=[uuid, bluetooth.SERIAL_PORT_CLASS],
    profiles=[bluetooth.SERIAL_PORT_PROFILE]
)

print(f"Waiting for Bluetooth connection on RFCOMM channel {port}")

# Function to handle Bluetooth connections
def handle_bluetooth_connection(client_sock, client_info):
    print(f"Accepted connection from {client_info}")
    ws = websocket.WebSocket()
    
    try:
        # Connect to the WebSocket server
        ws.connect(WS_URL)
        print("Connected to WebSocket server")
        
        while True:
            # Receive data from Bluetooth
            data = client_sock.recv(1024)
            if not data:
                break
                
            # Parse the command
            try:
                command_str = data.decode('utf-8')
                print(f"Received raw data: {command_str}")
                
                command = json.loads(command_str)
                print(f"Parsed command: {command}")
                
                # Forward the command to WebSocket server
                ws.send(json.dumps(command))
                print(f"Forwarded command to WebSocket")
                
                # Wait for any responses
                if ws.connected:
                    # Set a timeout for receiving WebSocket responses
                    ws.settimeout(0.1)
                    try:
                        response = ws.recv()
                        print(f"Received response from WebSocket: {response}")
                        # Forward the response back to the Bluetooth device
                        # Make sure it's sent as bytes
                        if isinstance(response, str):
                            client_sock.send(response.encode('utf-8'))
                        else:
                            client_sock.send(response)
                    except websocket.WebSocketTimeoutException:
                        pass  # No response available
                    finally:
                        ws.settimeout(None)  # Reset timeout
            except json.JSONDecodeError:
                print(f"Invalid JSON: {command_str}")
            except UnicodeDecodeError:
                print(f"Unable to decode data as UTF-8: {data}")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        ws.close()
        client_sock.close()
        print(f"Connection from {client_info} closed")

# Main loop to accept connections
while True:
    try:
        client_sock, client_info = server_sock.accept()
        print(f"Accepted connection from {client_info}")
        
        # Start a new thread to handle this connection
        client_thread = threading.Thread(
            target=handle_bluetooth_connection,
            args=(client_sock, client_info)
        )
        client_thread.daemon = True
        client_thread.start()
    except Exception as e:
        print(f"Error accepting connection: {e}")
        break

# Clean up
server_sock.close()
print("Bluetooth server stopped") 