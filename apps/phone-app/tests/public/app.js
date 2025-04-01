import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyByO6Jao6YnIQoUZInZc40zr6Rl-jQizpw",
    authDomain: "group31-project-2025-451402.firebaseapp.com",
    projectId: "group31-project-2025-451402",
    storageBucket: "group31-project-2025-451402.firebasestorage.app",
    messagingSenderId: "261308802493",
    appId: "1:261308802493:web:1a2f77a6ceb7672752ded4",
    measurementId: "G-HM2KV5T7FV"
  };

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

console.log(app);
console.log(window.firebaseApp);
console.log(window.firebaseAnalytics);

// Since you have sign in/out buttons, let's add authentication functionality
const signInButton = document.getElementById('signInButton');
const signOutButton = document.getElementById('signOutButton');
const userDetails = document.getElementById('userDetails');
const userSignedIn = document.getElementById('userSignedIn');
const userSignedOut = document.getElementById('userSignedOut');

// At the top of your file (after Firebase initialization)
const apiKey = "AIzaSyAVStMRyP78jteCQaS9SugOn5KnWgwVtxY";
const baseUrl = "https://conversation-gateway-3c1kiif1.uk.gateway.dev";

// Hard coded values from .env file for testing
const API_URL = "http://35.221.48.83";
const API_USERNAME = "admin";
const API_PASSWORD = "Group312025.";

// Create the Basic Auth header
const AUTH_HEADER = {
    "Authorization": "Basic " + btoa(`${API_USERNAME}:${API_PASSWORD}`)
};

// Test data constants (similar to the Python test)
const TEST_USER_ID = 9999;
const TEST_DATE = "2025-02-26";
const TEST_MONTH = "02";
const TEST_YEAR = "2025";
const TEST_CONVERSATION = "This is a test conversation for unit testing.";

// Sign in with Google
signInButton.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        console.log('Signed in:', result.user);
    } catch (error) {
        console.error('Sign in error:', error);
    }
});

// Sign out
signOutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        console.log('Signed out');
    } catch (error) {
        console.error('Sign out error:', error);
    }
});

// Listen for auth state changes
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        userSignedOut.hidden = true;
        userSignedIn.hidden = false;
        userDetails.innerHTML = `
            <h3>Welcome ${user.displayName}!</h3>
            <img src="${user.photoURL}" alt="Profile picture" style="width: 50px; border-radius: 50%;">
            <p>Email: ${user.email}</p>
            
            <!-- Add test buttons with hardcoded credentials -->
            <div class="api-test-buttons">
                <button id="testStoreConversationBtn">Test Store Conversation</button>
                <button id="testSearchConversationBtn">Test Search Conversation</button>
                <button id="testSearchNoConversationBtn">Test Search Non-Existent Conversation</button>
                <button id="testUnauthorizedAccessBtn">Test Unauthorized Access</button>
                <button id="showTokenBtn">Show Auth Token</button>
            </div>
            <div id="tokenDisplay" style="display:none; margin-top: 10px; padding: 10px; background-color: #f5f5f5; border-radius: 5px; word-break: break-all;"></div>
            <div id="apiTestResults" style="margin-top: 20px; padding: 10px; background-color: #f5f5f5; border-radius: 5px;"></div>
        `;

        // Add event listeners for test buttons
        document.getElementById('testStoreConversationBtn').addEventListener('click', testStoreConversation);
        document.getElementById('testSearchConversationBtn').addEventListener('click', testSearchConversation);
        document.getElementById('testSearchNoConversationBtn').addEventListener('click', testSearchNoConversation);
        document.getElementById('testUnauthorizedAccessBtn').addEventListener('click', testUnauthorizedAccess);
        document.getElementById('showTokenBtn').addEventListener('click', showToken);

        // Add token debug button handling
        document.getElementById('showTokenBtn').addEventListener('click', async () => {
            try {
                const token = await auth.currentUser.getIdToken(true);
                const tokenDisplay = document.getElementById('tokenDisplay');
                tokenDisplay.textContent = token;
                tokenDisplay.style.display = 'block';
                
                // Also log it to console
                console.log('Auth token:', token);
                
                // Copy to clipboard
                navigator.clipboard.writeText(token).then(
                    () => console.log('Token copied to clipboard'),
                    (err) => console.error('Could not copy token: ', err)
                );
            } catch (error) {
                console.error('Error getting token:', error);
            }
        });
    } else {
        // User is signed out
        userSignedOut.hidden = false;
        userSignedIn.hidden = true;
        userDetails.innerHTML = '';
    }
});

// Test storing a conversation
async function testStoreConversation() {
    const resultsDiv = document.getElementById('apiTestResults');
    resultsDiv.innerHTML = `<p>Testing store conversation...</p>`;
    
    try {
        // Create FormData and append the test data
        const formData = new FormData();
        formData.append('user_id', TEST_USER_ID);
        formData.append('date', TEST_DATE);
        formData.append('month', TEST_MONTH);
        formData.append('year', TEST_YEAR);
        
        // Create a file for conversation
        const conversationBlob = new Blob(
            [TEST_CONVERSATION], 
            { type: 'text/plain' }
        );
        formData.append('conversation', conversationBlob, 'conversation.txt');
        
        const response = await fetch(`${API_URL}/store/`, {
            method: 'POST',
            headers: {
                ...AUTH_HEADER
                // Don't set Content-Type when using FormData
            },
            body: formData
        });
        
        const data = await response.json();
        
        resultsDiv.innerHTML = `
            <h4>Store Conversation Test Results:</h4>
            <p>Status: ${response.status}</p>
            <pre>${JSON.stringify(data, null, 2)}</pre>
        `;
        
        console.log("Store response:", data);
    } catch (error) {
        resultsDiv.innerHTML = `
            <h4>Store Conversation Test Error:</h4>
            <p style="color: red;">${error.message}</p>
        `;
        console.error("Store error:", error);
    }
}

// Test searching for a conversation
async function testSearchConversation() {
    const resultsDiv = document.getElementById('apiTestResults');
    resultsDiv.innerHTML = `<p>Testing search conversation...</p>`;
    
    try {
        const response = await fetch(`${API_URL}/search/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...AUTH_HEADER
            },
            body: JSON.stringify({
                user_id: TEST_USER_ID,
                date: TEST_DATE
            })
        });
        
        const data = await response.json();
        
        resultsDiv.innerHTML = `
            <h4>Search Conversation Test Results:</h4>
            <p>Status: ${response.status}</p>
            <pre>${JSON.stringify(data, null, 2)}</pre>
        `;
        
        console.log("Search response:", data);
    } catch (error) {
        resultsDiv.innerHTML = `
            <h4>Search Conversation Test Error:</h4>
            <p style="color: red;">${error.message}</p>
        `;
        console.error("Search error:", error);
    }
}

// Test searching for a non-existent conversation
async function testSearchNoConversation() {
    const resultsDiv = document.getElementById('apiTestResults');
    resultsDiv.innerHTML = `<p>Testing search for non-existent conversation...</p>`;
    
    try {
        const response = await fetch(`${API_URL}/search/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...AUTH_HEADER
            },
            body: JSON.stringify({
                user_id: 123456,  // Non-existent user ID
                date: "2025-01-01"
            })
        });
        
        const data = await response.json();
        
        resultsDiv.innerHTML = `
            <h4>Search Non-Existent Conversation Test Results:</h4>
            <p>Status: ${response.status}</p>
            <pre>${JSON.stringify(data, null, 2)}</pre>
        `;
        
        console.log("Search non-existent response:", data);
    } catch (error) {
        resultsDiv.innerHTML = `
            <h4>Search Non-Existent Conversation Test Error:</h4>
            <p style="color: red;">${error.message}</p>
        `;
        console.error("Search non-existent error:", error);
    }
}

// Test unauthorized access
async function testUnauthorizedAccess() {
    const resultsDiv = document.getElementById('apiTestResults');
    resultsDiv.innerHTML = `<p>Testing unauthorized access...</p>`;
    
    try {
        // Don't include auth header
        const response = await fetch(`${API_URL}/store/`, {
            method: 'POST'
        });
        
        let resultText = `
            <h4>Unauthorized Access Test Results:</h4>
            <p>Status: ${response.status}</p>
        `;
        
        try {
            const data = await response.json();
            resultText += `<pre>${JSON.stringify(data, null, 2)}</pre>`;
            console.log("Unauthorized response:", data);
        } catch (e) {
            resultText += `<p>Could not parse JSON response: ${e.message}</p>`;
        }
        
        resultsDiv.innerHTML = resultText;
    } catch (error) {
        resultsDiv.innerHTML = `
            <h4>Unauthorized Access Test Error:</h4>
            <p style="color: red;">${error.message}</p>
        `;
        console.error("Unauthorized access error:", error);
    }
}

async function showToken() {
    try {
        const token = await auth.currentUser.getIdToken(true);
        const tokenDisplay = document.getElementById('tokenDisplay');
        tokenDisplay.textContent = token;
        tokenDisplay.style.display = 'block';
        
        console.log('Auth token:', token);
        
        navigator.clipboard.writeText(token).then(
            () => console.log('Token copied to clipboard'),
            (err) => console.error('Could not copy token: ', err)
        );
    } catch (error) {
        console.error('Error getting token:', error);
    }
}

// Export these if you need to use them in other files
export { app, auth, db, analytics };
export { app, auth, db, analytics };