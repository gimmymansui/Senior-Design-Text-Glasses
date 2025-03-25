import 'package:flutter/material.dart';

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
  _MyHomePageState createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
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
                Container(
                  width: 200,
                  height: 50,
                  margin: EdgeInsets.symmetric(horizontal: 5),
                  child: ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.zero,
                      ),
                    ),
                    child: Text('Glasses Battery', style: TextStyle(fontSize: 12)),
                  ),
                ),
                Container(
                  width: 200,
                  height: 50,
                  margin: EdgeInsets.symmetric(horizontal: 5),
                  child: ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.zero,
                      ),
                    ),
                    child: Text('Glasses Status', style: TextStyle(fontSize: 12)),
                  ),
                ),
                Container(
                  width: 200,
                  height: 50,
                  margin: EdgeInsets.symmetric(horizontal: 5),
                  child: ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.zero,
                      ),
                    ),
                    child: Text('Internet Connection', style: TextStyle(fontSize: 12)),
                  ),
                ),
              ],
            ),
            SizedBox(height: 40), // Spacing between buttons and start button

            // Start button (it changes color and text when pressed)
            Container(
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
            ),
            SizedBox(height: 40),
            // Four buttons below the start button
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Column(
                  children: [
                    Container(
                      width: 150,
                      height: 50,
                      margin: EdgeInsets.symmetric(vertical: 5),
                      child: Center(
                        child: ElevatedButton(
                          onPressed: () {},
                          style: ElevatedButton.styleFrom(
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.zero,
                            ),
                          ),
                          child: Text('Settings'),
                        ),
                      ),
                    ),
                    Container(
                      width: 300,
                      height: 50,
                      margin: EdgeInsets.symmetric(vertical: 5),
                      child: Center(
                        child: ElevatedButton(
                          onPressed: () {},
                          style: ElevatedButton.styleFrom(
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.zero,
                            ),
                          ),
                          child: Text('Transcription History'),
                        ),
                      ),
                    ),
                    Container(
                      width: 300,
                      height: 50,
                      margin: EdgeInsets.symmetric(vertical: 5),
                      child: Center(
                        child: ElevatedButton(
                          onPressed: () {},
                          style: ElevatedButton.styleFrom(
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.zero,
                            ),
                          ),
                          child: Text('Account Option'),
                        ),
                      ),
                    ),
                    Container(
                      width: 150,
                      height: 50,
                      margin: EdgeInsets.symmetric(vertical: 5),
                      child: Center(
                        child: ElevatedButton(
                          onPressed: () {},
                          style: ElevatedButton.styleFrom(
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.zero,
                            ),
                          ),
                          child: Text('Support'),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
