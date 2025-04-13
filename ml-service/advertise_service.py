#!/usr/bin/env python3

import dbus
import dbus.service
import dbus.mainloop.glib
from gi.repository import GLib
import sys
import signal

# --- Configuration ---
ADAPTER_INTERFACE = "org.bluez.Adapter1"
ADVERTISING_MANAGER_INTERFACE = "org.bluez.LEAdvertisingManager1"
ADVERTISEMENT_INTERFACE = "org.bluez.LEAdvertisement1"
SERVICE_UUID = "94f39d29-7d6d-437d-973b-fba39e49d4ee" # Your specific UUID
ADVERTISEMENT_PATH = "/org/bluez/example/advertisement0" # Must match Advertisement class path
BUS_NAME = "org.bluez"
ADAPTER_PATH = "/org/bluez/hci0" # Usually hci0, check with hciconfig if needed
# --- End Configuration ---

mainloop = None

class Advertisement(dbus.service.Object):
    PATH_BASE = "/org/bluez/example/advertisement"

    def __init__(self, bus, index, advertising_type):
        self.path = self.PATH_BASE + str(index)
        self.bus = bus
        self.ad_type = advertising_type
        self.service_uuids = [SERVICE_UUID] # Advertise our specific service UUID
        self.manufacturer_data = None
        self.solicit_uuids = None
        self.service_data = None
        self.local_name = "OptiViewGlasses" # Optional: Set a name for the advertisement
        self.include_tx_power = False
        self.data = None
        dbus.service.Object.__init__(self, bus, self.path)

    def get_properties(self):
        properties = dict()
        properties['Type'] = self.ad_type
        properties['ServiceUUIDs'] = dbus.Array(self.service_uuids, signature='s')
        if self.local_name is not None:
             properties['LocalName'] = dbus.String(self.local_name)
        properties['IncludeTxPower'] = dbus.Boolean(self.include_tx_power)
        # Add other properties if needed (manufacturer_data, service_data etc.)
        # print(f"Advertisement Properties: {properties}") # Debug print
        return {ADVERTISEMENT_INTERFACE: properties}

    @dbus.service.method(dbus.PROPERTIES_IFACE, in_signature='s', out_signature='a{sv}')
    def GetAll(self, interface):
        # print(f"GetAll called for interface: {interface}") # Debug print
        if interface != ADVERTISEMENT_INTERFACE:
            raise dbus.exceptions.DBusException(
                'org.freedesktop.DBus.Error.UnknownInterface',
                'Invalid interface')
        return self.get_properties()[ADVERTISEMENT_INTERFACE]

    @dbus.service.method(ADVERTISEMENT_INTERFACE, in_signature='', out_signature='')
    def Release(self):
        print(f"{self.path} Released")


def register_advertisement_cb():
    print("Advertisement registered successfully")

def register_advertisement_error_cb(error):
    print(f"Failed to register advertisement: {error}")
    if mainloop:
        mainloop.quit()

def find_adapter(bus):
    remote_om = dbus.Interface(bus.get_object(BUS_NAME, "/"),
                               dbus.PROPERTIES_IFACE)
    objects = remote_om.GetAll(ADAPTER_INTERFACE)

    for path, properties in objects.items():
        if "org.bluez.Adapter1" in properties:
            # print(f"Found adapter at {path}") # Debug print
            return path
    return None

def setup_advertising():
    global mainloop
    dbus.mainloop.glib.DBusGMainLoop(set_as_default=True)

    bus = dbus.SystemBus()

    adapter_path = find_adapter(bus)
    if not adapter_path:
        print("Error: Bluetooth adapter (hci0) not found.")
        sys.exit(1)
    # print(f"Using adapter: {adapter_path}") # Debug print

    adapter_props = dbus.Interface(bus.get_object(BUS_NAME, adapter_path),
                                   dbus.PROPERTIES_IFACE)
    adapter_props.Set(ADAPTER_INTERFACE, "Powered", dbus.Boolean(1))

    ad_manager = dbus.Interface(bus.get_object(BUS_NAME, adapter_path),
                                ADVERTISING_MANAGER_INTERFACE)

    # Create the advertisement object
    # Using index 0 and type "peripheral"
    advertisement = Advertisement(bus, 0, "peripheral")

    mainloop = GLib.MainLoop()

    print("Registering advertisement...")
    ad_manager.RegisterAdvertisement(advertisement.get_path(), {},
                                     reply_handler=register_advertisement_cb,
                                     error_handler=register_advertisement_error_cb)

    print("Advertisement started. Press Ctrl+C to stop.")
    try:
        mainloop.run() # Runs until mainloop.quit() is called
    except KeyboardInterrupt:
        print("Stopping advertisement...")
    finally:
        # Unregister advertisement on exit
        try:
            print(f"Unregistering advertisement: {advertisement.get_path()}")
            ad_manager.UnregisterAdvertisement(advertisement.get_path())
            print("Advertisement unregistered.")
        except Exception as e:
             # Might fail if bluetoothd crashed or adapter removed
            print(f"Error unregistering advertisement: {e}")
        # Optional: Power down adapter
        # adapter_props.Set(ADAPTER_INTERFACE, "Powered", dbus.Boolean(0))
        print("Exiting.")

def signal_handler(sig, frame):
    print('Caught signal, exiting cleanly...')
    if mainloop:
        mainloop.quit()

if __name__ == '__main__':
    # Register signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler) # Ctrl+C
    signal.signal(signal.SIGTERM, signal_handler) # kill

    setup_advertising() 