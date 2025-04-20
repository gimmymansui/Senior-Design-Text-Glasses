console.log('--- main.js loaded ---');

/**
 * Main Application JavaScript
 * Handles UI interactions, animations, and state management
 */

// Global Variables
let isRainbow = false;
let isListening = false;
let button;
let buttonText;
let sidebar;
let menuToggle;
let universe;
let backgroundUpload;
let backgroundOverlay;
let colorBlindToggle;
let funkyToggle;
let bluetoothConnectButton;
let bluetoothStatus;
let bluetoothDisconnectButton;

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    button = document.getElementById("startButton");
    buttonText = document.getElementById("buttonText");
    sidebar = document.getElementById("sidebar");
    menuToggle = document.getElementById("menuToggle");
    universe = document.getElementById("universe");
    backgroundUpload = document.getElementById("backgroundUpload");
    backgroundOverlay = document.getElementById("backgroundOverlay");
    colorBlindToggle = document.getElementById("colorBlindToggle");
    funkyToggle = document.getElementById("funkyToggle");
    bluetoothConnectButton = document.getElementById("bluetoothConnect");
    bluetoothStatus = document.getElementById("bluetoothStatus");
    bluetoothDisconnectButton = document.getElementById("bluetoothDisconnect");

    // Set up event listeners
    setupEventListeners();
    
    // Create stars for background
    createStars();
    
    // Check for saved preferences
    loadSavedPreferences();
    
    // Check URL parameters
    checkUrlParameters();
    
    // Initialize Bluetooth handlers
    setupBluetoothHandlers();
});

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Sidebar toggle
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }
    
    // Close sidebar when clicking outside
    document.addEventListener('click', function(event) {
        if (sidebar && !sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
            closeSidebar();
        }
    });
    
    // Background upload functionality
    if (backgroundUpload) {
        backgroundUpload.addEventListener('change', handleBackgroundUpload);
    }
    
    // Color Blind Mode Toggle
    if (colorBlindToggle) {
        colorBlindToggle.addEventListener('change', function() {
            document.body.classList.toggle('color-blind-mode', this.checked);
            localStorage.setItem('colorBlindMode', this.checked);
        });
    }
    
    // Funky Mode Toggle
    if (funkyToggle) {
        funkyToggle.addEventListener('change', function() {
            document.body.classList.toggle('funky-mode', this.checked);
            localStorage.setItem('funkyMode', this.checked);
        });
    }
    
    // Start button hover effects
    if (button) {
        button.addEventListener("mouseover", function() {
            if (isListening) {
                buttonText.innerHTML = "End";
            }
        });
        
        button.addEventListener("mouseleave", function() {
            if (isListening) {
                buttonText.innerHTML = "Listening ...";
            }
        });
    }
    
    // Login modal close on click outside
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.addEventListener('click', function(event) {
            if (event.target === this) {
                this.style.display = 'none';
            }
        });
    }
    
    // Example: Assuming a login button exists with id="googleLoginButton"
    const googleLoginBtn = document.getElementById('googleLoginButton');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => {
            // Ensure authService is available (it should be if auth.js loaded)
            if (window.authService && typeof window.authService.signInWithGoogle === 'function') {
                window.authService.signInWithGoogle();
            } else {
                console.error("authService.signInWithGoogle is not available!");
            }
        });
    }
    
    // Example: Assuming a logout button exists, maybe inside the userInfo element
    const logoutButton = document.getElementById('logoutButton'); // Give your logout button an ID
    if (logoutButton) {
         logoutButton.addEventListener('click', () => {
            if (window.authService && typeof window.authService.signOutUser === 'function') {
                window.authService.signOutUser();
            } else {
                console.error("authService.signOutUser is not available!");
            }
        });
    }
    
     // Example: Link/Button to Transcriptions - Just navigate directly
    const transcriptionLink = document.getElementById('transcriptionLink'); // Give your link/button an ID
    if (transcriptionLink) {
        transcriptionLink.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior if it's an <a> tag
            console.log("Navigating to transcription.html");
            window.location.href = 'transcription.html'; // Navigate directly
        });
    }
}

/**
 * Toggle sidebar visibility
 */
function toggleSidebar() {
    sidebar.classList.add('open');
    menuToggle.classList.add('hidden');
}

/**
 * Close the sidebar
 */
function closeSidebar() {
    sidebar.classList.remove('open');
    menuToggle.classList.remove('hidden');
}

/**
 * Handle background image upload
 */
function handleBackgroundUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            backgroundOverlay.style.backgroundImage = `url(${e.target.result})`;
        };
        reader.readAsDataURL(file);
    }
}

/**
 * Toggle the start/listening button state
 */
function toggleButton() {
    if (!window.bluetoothHandler || (!window.bluetoothHandler.isConnected && !isListening)) {
        alert("Please connect to the Bluetooth glasses first.");
        return;
    }

    if (!isListening) {
        buttonText.innerHTML = "Listening ...";
        button.classList.add("listening");
        isRainbow = true;
        isListening = true;
        
        if (window.bluetoothHandler.isConnected) {
            console.log("Sending record command (from Start state)...");
            window.bluetoothHandler.sendRecordCommand()
                .then(() => console.log("Record command sent successfully."))
                .catch(error => {
                    console.error("Error sending record command:", error);
                    alert("Failed to send record command: " + error.message);
                });
        }
    } else {
        buttonText.innerHTML = "Start";
        button.classList.remove("listening");
        isRainbow = false;
        isListening = false;
        
        if (window.bluetoothHandler.isConnected) {
            console.log("Sending record command (from Listening state)...");
            window.bluetoothHandler.sendRecordCommand()
                .then(() => console.log("Record command sent successfully (stop toggle)."))
                .catch(error => {
                    console.error("Error sending record command (stop toggle):", error);
                    alert("Failed to send stop command: " + error.message);
                });
        }
    }
}

/**
 * Create starry background
 */
function createStars() {
    for (let i = 0; i < 200; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        star.style.width = `${Math.random() * 3}px`;
        star.style.height = star.style.width;
        star.style.top = `${Math.random() * 100}%`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 3}s`;
        universe.appendChild(star);
    }
}

/**
 * Load saved preferences from localStorage
 */
function loadSavedPreferences() {
    // Check for saved color blind mode preference
    const savedColorBlindMode = localStorage.getItem('colorBlindMode') === 'true';
    if (colorBlindToggle) {
        colorBlindToggle.checked = savedColorBlindMode;
        if (savedColorBlindMode) {
            document.body.classList.add('color-blind-mode');
        }
    }
    
    // Check for saved funky mode preference
    const savedFunkyMode = localStorage.getItem('funkyMode') === 'true';
    if (funkyToggle) {
        funkyToggle.checked = savedFunkyMode;
        if (savedFunkyMode) {
            document.body.classList.add('funky-mode');
        }
    }
}

/**
 * Check URL parameters for specific actions
 */
function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('showLogin') === 'true') {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) loginModal.style.display = 'flex';
    }
}

/**
 * Set up Bluetooth handlers
 */
function setupBluetoothHandlers() {
    if (!window.bluetoothHandler) {
        console.error("Bluetooth handler not found!");
        updateBluetoothUI(false);
        return;
    }

    if (bluetoothConnectButton) {
        bluetoothConnectButton.addEventListener('click', connectBluetooth);
    }
    if (bluetoothDisconnectButton) {
        bluetoothDisconnectButton.addEventListener('click', disconnectBluetooth);
    }

    window.bluetoothHandler.onConnected = () => {
        console.log("Main.js: Received onConnected callback.");
        updateBluetoothUI(true);
    };

    window.bluetoothHandler.onDisconnected = () => {
        console.log("Main.js: Received onDisconnected callback.");
        updateBluetoothUI(false);
    };
    
    window.bluetoothHandler.onDataReceived = (data) => {
        console.log("Main.js: Received data:", data);
    };

    updateBluetoothUI(window.bluetoothHandler.isConnected);
}

/**
 * Connect to Bluetooth device
 */
async function connectBluetooth() {
    if (!window.bluetoothHandler) return;

    console.log("Attempting to connect Bluetooth...");
    if (bluetoothStatus) bluetoothStatus.textContent = "Connecting...";
    bluetoothConnectButton.disabled = true;
    bluetoothDisconnectButton.style.display = 'none';
    
    try {
        await window.bluetoothHandler.connect();
    } catch (error) {
        console.error("Bluetooth connection failed:", error);
        if (bluetoothStatus) bluetoothStatus.textContent = "Connection failed";
        alert(`Connection failed: ${error.message}`);
        updateBluetoothUI(false);
    }
}

/**
 * Update Bluetooth UI elements
 */
function updateBluetoothUI(isConnected) {
    console.log("Updating Bluetooth UI, isConnected:", isConnected);
    if (bluetoothStatus) {
        bluetoothStatus.textContent = isConnected ? `Connected (${window.bluetoothHandler?.device?.name || 'Unknown'})` : "Disconnected";
    }

    if (bluetoothConnectButton) {
        bluetoothConnectButton.style.display = isConnected ? 'none' : 'inline-block';
        bluetoothConnectButton.disabled = false;
    }

    if (bluetoothDisconnectButton) {
        bluetoothDisconnectButton.style.display = isConnected ? 'inline-block' : 'none';
    }

    if (button) {
        button.disabled = !isConnected && !isListening;
    }
    
    if (!isConnected && !isListening && buttonText) {
         buttonText.innerHTML = "Start";
         button.classList.remove("listening");
         isRainbow = false;
    }
}

/**
 * Disconnect from Bluetooth device
 */
async function disconnectBluetooth() {
    if (!window.bluetoothHandler || !window.bluetoothHandler.isConnected) return;

    console.log("Attempting to disconnect Bluetooth...");
     if (bluetoothStatus) bluetoothStatus.textContent = "Disconnecting...";
     bluetoothDisconnectButton.disabled = true;
     
    try {
        await window.bluetoothHandler.disconnect();
    } catch (error) {
        console.error("Bluetooth disconnection error:", error);
        if (bluetoothStatus) bluetoothStatus.textContent = "Disconnection error";
         alert(`Disconnection error: ${error.message}`);
         updateBluetoothUI(false); 
    }
    finally {
         bluetoothDisconnectButton.disabled = false;
    }
}

// Expose functions needed by HTML
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.toggleButton = toggleButton;
window.connectBluetooth = connectBluetooth;
window.disconnectBluetooth = disconnectBluetooth;
