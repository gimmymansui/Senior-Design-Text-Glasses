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

    // Set up event listeners
    setupEventListeners();
    
    // Create stars for background
    createStars();
    
    // Check for saved preferences
    loadSavedPreferences();
    
    // Check auth state for user display
    checkAuthState();
    
    // Check URL parameters
    checkUrlParameters();
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
    if (!isRainbow) {
        buttonText.innerHTML = "Listening ...";
        button.classList.add("listening");
        isRainbow = true;
        isListening = true;
    } else {
        buttonText.innerHTML = "Start";
        button.classList.remove("listening");
        isRainbow = false;
        isListening = false;
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
 * Check authentication before redirecting to transcription
 */
function checkAuthForTranscription() {
    if (window.firebaseAuth && window.firebaseAuth.checkAuth('transcription.html')) {
        window.location.href = 'transcription.html';
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
 * Check authentication state and update UI
 */
function checkAuthState() {
    if (window.firebase && window.firebase.auth) {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                // User is signed in
                const userInfo = document.getElementById('userInfo');
                const userAvatar = document.getElementById('userAvatar');
                const userName = document.getElementById('userName');
                
                if (userInfo) userInfo.style.display = 'flex';
                if (userAvatar) userAvatar.src = user.photoURL || 'https://via.placeholder.com/40';
                if (userName) userName.textContent = user.displayName || user.email;
                
                // Close the login modal if it's open
                const loginModal = document.getElementById('loginModal');
                if (loginModal) loginModal.style.display = 'none';
            } else {
                // User is signed out
                const userInfo = document.getElementById('userInfo');
                if (userInfo) userInfo.style.display = 'none';
            }
        });
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

// Expose functions needed by HTML
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.toggleButton = toggleButton;
window.checkAuthForTranscription = checkAuthForTranscription;
