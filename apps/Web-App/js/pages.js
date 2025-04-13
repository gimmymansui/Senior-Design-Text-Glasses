/**
 * Pages JavaScript
 * Contains functionality specific to individual pages
 */

// Global Variables
let universe;

/**
 * Initialize the page when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    universe = document.getElementById('universe');
    
    // Create starry background
    createStars();

    // Check for page-specific initializations
    initPageSpecific();
});

/**
 * Create starry background
 */
function createStars() {
    if (!universe) return;
    
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
 * Initialize page-specific functionality
 */
function initPageSpecific() {
    // Determine current page
    const currentPage = window.location.pathname.split('/').pop();
    
    // Initialize functionality based on page
    switch (currentPage) {
        case 'glasses_battery.html':
            initBatteryPage();
            break;
        case 'glasses_status.html':
            initStatusPage();
            break;
        case 'internet_connection.html':
            initConnectionPage();
            break;
        case 'account.html':
            initAccountPage();
            break;
        case 'settings.html':
            initSettingsPage();
            break;
        case 'support.html':
            initSupportPage();
            break;
        case 'transcription.html':
            initTranscriptionPage();
            break;
    }
}

/**
 * Go to the home page
 */
function goHome() {
    window.location.href = 'index.html';
}

/**
 * Initialize Glasses Battery Page
 */
function initBatteryPage() {
    console.log('Battery page initialized');
    // Add any specific battery page initialization here
    
    // For example, we might want to update battery data
    // updateBatteryData();
}

/**
 * Initialize Glasses Status Page
 */
function initStatusPage() {
    console.log('Status page initialized');
    // Add any specific status page initialization here
    
    // For example, we might want to update status indicators
    // updateStatusIndicators();
}

/**
 * Initialize Internet Connection Page
 */
function initConnectionPage() {
    console.log('Connection page initialized');
    // Add any specific connection page initialization here
    
    // For example, we might want to check the current connection
    // checkCurrentConnection();
}

/**
 * Initialize Account Page
 */
function initAccountPage() {
    console.log('Account page initialized');
    // Check if user is authenticated
    if (window.firebaseAuth && !window.firebaseAuth.isAuthenticated()) {
        window.location.href = 'index.html?showLogin=true';
        return;
    }
    
    // Load user profile if authenticated
    if (window.firebase && window.firebase.auth) {
        const user = firebase.auth().currentUser;
        if (user) {
            // Update profile display
            const profileName = document.getElementById('profileName');
            const profileEmail = document.getElementById('profileEmail');
            const profileImage = document.getElementById('profileImage');
            
            if (profileName) profileName.textContent = user.displayName || 'User';
            if (profileEmail) profileEmail.textContent = user.email;
            if (profileImage) profileImage.src = user.photoURL || 'https://via.placeholder.com/120';
        }
    }
}

/**
 * Initialize Settings Page
 */
function initSettingsPage() {
    console.log('Settings page initialized');
    // Add any specific settings page initialization here
    
    // For example, we might want to load current settings
    // loadCurrentSettings();
}

/**
 * Initialize Support Page
 */
function initSupportPage() {
    console.log('Support page initialized');
    // Add any specific support page initialization here
}

/**
 * Initialize Transcription Page
 */
function initTranscriptionPage() {
    console.log('Transcription page initialized');
    // Check if user is authenticated
    if (window.firebaseAuth && !window.firebaseAuth.isAuthenticated()) {
        window.location.href = 'index.html?showLogin=true';
        return;
    }
    
    // Load transcriptions if authenticated
    // loadTranscriptions();
}

// Expose functions for HTML
window.goHome = goHome; 