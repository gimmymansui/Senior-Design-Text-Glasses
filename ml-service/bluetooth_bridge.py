import socket
import json
import threading
import websocket
import subprocess
import time
import sys
import os
import dbus
import dbus.service
import dbus.mainloop.glib
from gi.repository import GLib

class BTProfile(dbus.service.Object):
    def __init__(self, bus, path):
        dbus.service.Object.__init__(self, bus, path)
        self.fd = -1
        self.on_connect = None

    @dbus.service.method("org.bluez.Profile1", in_signature="", out_signature="")
    def Release(self):
        print("Profile released")

    @dbus.service.method("org.bluez.Profile1", in_signature="oha{sv}", out_signature="")
    def NewConnection(self, path, fd, properties):
        self.fd = fd.take()
        print(f"New connection on {path}")
        
        if self.on_connect:
            # Run connection handler in a separate thread
            thread = threading.Thread(target=self.on_connect, args=(self.fd,))
            thread.daemon = True
            thread.start()

class BluetoothBridge:
    def __init__(self):
        # Initialize D-Bus
        dbus.mainloop.glib.DBusGMainLoop(set_as_default=True)
        self.bus = dbus.SystemBus()
        self.mainloop = GLib.MainLoop()
        
        # UUID must match the one in your webapp
        self.uuid = "94f39d29-7d6d-437d-973b-fba39e49d4ee"
        
        # WebSocket connection
        self.ws = None
        self.ws_url = "ws://localhost:8080"
        
        # Set up D-Bus proxies
        self.adapter_obj = self.bus.get_object("org.bluez", "/org/bluez/hci0")
        self.adapter = dbus.Interface(self.adapter_obj, "org.bluez.Adapter1")
        self.adapter_props = dbus.Interface(self.adapter_obj, "org.freedesktop.DBus.Properties")
        
        self.manager_obj = self.bus.get_object("org.bluez", "/org/bluez")
        self.profile_manager = dbus.Interface(self.manager_obj, "org.bluez.ProfileManager1")
        
        # Set up WebSocket connection
        self.connect_websocket()

    def connect_websocket(self):
        def on_message(ws, message):
            print(f"Received WebSocket message: {message}")

        def on_error(ws, error):
            print(f"WebSocket error: {error}")

        def on_close(ws, close_status_code, close_msg):
            print("WebSocket connection closed")
            # Attempt to reconnect after delay
            threading.Timer(5.0, self.connect_websocket).start()

        def on_open(ws):
            print("WebSocket connection established")

        # Create WebSocket connection
        try:
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
        except Exception as e:
            print(f"Error connecting to WebSocket: {e}")

    def process_client(self, fd):
        try:
            client_sock = socket.fromfd(fd, socket.AF_UNIX, socket.SOCK_STREAM)
            client_sock.settimeout(60)  # 60 second timeout
            
            print("Processing client connection")
            
            while True:
                try:
                    data = client_sock.recv(1024)
                    if not data:
                        break
                    
                    try:
                        message = json.loads(data.decode())
                        print(f"Received from client: {message}")
                        
                        if message.get('type') == 'record':
                            # Forward the record command to WebSocket
                            if self.ws and self.ws.sock and self.ws.sock.connected:
                                self.ws.send(json.dumps({'type': 'record'}))
                                print("Forwarded record command to WebSocket")
                    except json.JSONDecodeError:
                        print(f"Invalid JSON received: {data.decode()}")
                        
                except socket.timeout:
                    print("Socket timeout, checking connection...")
                    continue
                    
        except Exception as e:
            print(f"Error processing client: {e}")
        finally:
            try:
                os.close(fd)
            except:
                pass
            print("Client connection closed")

    def setup_profile(self):
        # Set adapter properties
        self.adapter_props.Set("org.bluez.Adapter1", "Powered", dbus.Boolean(True))
        self.adapter_props.Set("org.bluez.Adapter1", "Discoverable", dbus.Boolean(True))
        self.adapter_props.Set("org.bluez.Adapter1", "Pairable", dbus.Boolean(True))
        
        # Create profile
        profile_path = "/test/profile"
        profile = BTProfile(self.bus, profile_path)
        profile.on_connect = self.process_client
        
        profile_options = {
            "Name": "SerialPort",
            "Role": "server",
            "RequireAuthentication": dbus.Boolean(False),
            "RequireAuthorization": dbus.Boolean(False),
            "AutoConnect": dbus.Boolean(True),
            "ServiceRecord": """
                <?xml version="1.0" encoding="UTF-8" ?>
                <record>
                    <attribute id="0x0001">
                        <sequence>
                            <uuid value="0x1101"/>
                        </sequence>
                    </attribute>
                    <attribute id="0x0004">
                        <sequence>
                            <sequence>
                                <uuid value="0x0100"/>
                            </sequence>
                            <sequence>
                                <uuid value="0x0003"/>
                                <uint8 value="1"/>
                            </sequence>
                        </sequence>
                    </attribute>
                    <attribute id="0x0100">
                        <text value="Serial Port"/>
                    </attribute>
                </record>
            """
        }
        
        print("Registering profile...")
        self.profile_manager.RegisterProfile(profile_path, self.uuid, profile_options)
        print("Profile registered")
        
        return profile

    def run(self):
        try:
            # Set up the Bluetooth profile
            profile = self.setup_profile()
            
            print("Bluetooth bridge running. Device is discoverable.")
            print(f"UUID: {self.uuid}")
            print("Waiting for connections...")
            
            # Run the main loop
            self.mainloop.run()
            
        except Exception as e:
            print(f"Error in Bluetooth bridge: {e}")
        finally:
            self.mainloop.quit()

if __name__ == "__main__":
    # Check if running as root
    if os.geteuid() != 0:
        print("This script must be run as root. Try: sudo python3 bluetooth_bridge.py")
        sys.exit(1)
    
    # Install necessary packages if they're not already installed
    try:
        subprocess.run(["sudo", "apt-get", "update"], check=True)
        subprocess.run(["sudo", "apt-get", "install", "-y", "python3-dbus", "python3-gi"], check=True)
    except:
        print("Warning: Failed to install dependencies. Script may not work correctly.")
    
    # Configure Bluetooth using bluetoothctl
    try:
        subprocess.run(['bluetoothctl', 'power', 'on'], check=True)
        subprocess.run(['bluetoothctl', 'discoverable', 'on'], check=True)
        subprocess.run(['bluetoothctl', 'pairable', 'on'], check=True)
    except:
        print("Warning: Failed to configure Bluetooth with bluetoothctl.")
    
    bridge = BluetoothBridge()
    bridge.run()