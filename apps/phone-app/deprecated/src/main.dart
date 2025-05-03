import 'package:flutter/material.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:battery_plus/battery_plus.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Namer App',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
      ),
      home: MyHomePage(),
    );
  }
}

class MyHomePage extends StatefulWidget {
  @override
  MyHomePageState createState() => MyHomePageState();
}

class MyHomePageState extends State<MyHomePage> {
  bool isStarted = false; // Track if the button is in "Start" or "End" state

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            // Three buttons above the start button, arranged side by side
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildButton('Glasses Battery', () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => BatteryPage()),
                  );
                }),
                _buildButton('Glasses Status', () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => GlassesStatusPage()),
                  );
                }),
                _buildButton('Internet Connection', () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (context) => InternetConnectionPage()),
                  );
                }),
              ],
            ),
            SizedBox(height: 40), // Spacing between buttons and start button

            // Start button (it changes color and text when pressed)
            _buildStartButton(),
            SizedBox(height: 40),

            // Four buttons below the start button
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Column(
                  children: [
                    _buildButton('Settings', () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => SettingsPage()),
                      );
                    }),
                    _buildButton('Transcription History', () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (context) => TranscriptionHistoryPage()),
                      );
                    }),
                    _buildButton('Account Option', () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (context) => AccountOptionsPage()),
                      );
                    }),
                    _buildButton('Support', () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => SupportPage()),
                      );
                    }),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // Helper function to build buttons
  Widget _buildButton(String text, VoidCallback onPressed) {
    return Container(
      width: 200,
      height: 50,
      margin: EdgeInsets.symmetric(horizontal: 5),
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.zero,
          ),
        ),
        child: Text(text, style: TextStyle(fontSize: 12)),
      ),
    );
  }

  // Helper function to build start button
  Widget _buildStartButton() {
    return Container(
      width: 200,
      height: 200,
      decoration: BoxDecoration(
        color: isStarted ? Colors.red : Colors.blue, // Toggle color
        shape: BoxShape.circle,
      ),
      child: Center(
        child: TextButton(
          onPressed: () {
            setState(() {
              isStarted = !isStarted; // Toggle the state
            });
          },
          child: Text(
            isStarted ? 'End' : 'Start', // Toggle text
            style: TextStyle(
              color: Colors.white,
              fontSize: 32,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ),
    );
  }
}

// Internet Connection Page
class InternetConnectionPage extends StatefulWidget {
  @override
  InternetConnectionPageState createState() => InternetConnectionPageState();
}

class InternetConnectionPageState extends State<InternetConnectionPage> {
  String _connectionStatus = 'Checking...';

  @override
  void initState() {
    super.initState();
    _checkConnection();
  }

  Future<void> _checkConnection() async {
    var connectivityResult = await (Connectivity().checkConnectivity());
    if (connectivityResult == ConnectivityResult.mobile) {
      setState(() {
        _connectionStatus = 'Connected to Mobile Network';
      });
    } else if (connectivityResult == ConnectivityResult.wifi) {
      setState(() {
        _connectionStatus = 'Connected to WiFi';
      });
    } else {
      setState(() {
        _connectionStatus = 'No Internet Connection';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Internet Connection')),
      body: Center(
        child: Text(_connectionStatus, style: TextStyle(fontSize: 24)),
      ),
    );
  }
}

// Battery Page
class BatteryPage extends StatefulWidget {
  @override
  BatteryPageState createState() => BatteryPageState();
}

class BatteryPageState extends State<BatteryPage> {
  Battery _battery = Battery();
  String _batteryLevel = 'Checking...';

  @override
  void initState() {
    super.initState();
    _getBatteryLevel();
  }

  Future<void> _getBatteryLevel() async {
    final int batteryLevel = await _battery.batteryLevel;
    setState(() {
      _batteryLevel = '$batteryLevel%';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Battery Level')),
      body: Center(
        child: Text(
          'Battery Level: $_batteryLevel',
          style: TextStyle(fontSize: 24),
        ),
      ),
    );
  }
}

// Glasses Status Page
class GlassesStatusPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Glasses Status')),
      body: Center(
        child: Text('Device is currently ON', style: TextStyle(fontSize: 24)),
      ),
    );
  }
}

// Settings Page
class SettingsPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return _buildSimplePage(context, 'Settings');
  }
}

// Transcription History Page
class TranscriptionHistoryPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return _buildSimplePage(context, 'Transcription History');
  }
}

// Account Options Page
class AccountOptionsPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return _buildSimplePage(context, 'Account Option');
  }
}

// Support Page
class SupportPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return _buildSimplePage(context, 'Support');
  }
}

// Helper function to create a page with a back button
Widget _buildSimplePage(BuildContext context, String title) {
  return Scaffold(
    appBar: AppBar(title: Text(title)),
    body: Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('$title Page', style: TextStyle(fontSize: 24)),
          SizedBox(height: 20),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context); // Go back to home screen
            },
            child: Text('Go Back'),
          ),
        ],
      ),
    ),
  );
}
