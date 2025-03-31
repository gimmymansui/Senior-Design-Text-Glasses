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
            
            <!-- Add all test buttons -->
            <div class="api-test-buttons">
                <button id="testStoreBtn">Test Store API</button>
                <button id="testSearchBtn">Test Search API</button>
                <button id="testSummarizeBtn">Test Summarize API</button>
                <button id="testDirectBackendBtn">Test API Gateway</button>
                <button id="pingBackendBtn">Ping API Gateway</button>
                <button id="testGatewayBtn">OPTIONS Test</button>
                <button id="showTokenBtn">Show Auth Token</button>
            </div>
            <div id="tokenDisplay" style="display:none; margin-top: 10px; padding: 10px; background-color: #f5f5f5; border-radius: 5px; word-break: break-all;"></div>
            <div id="apiTestResults" style="margin-top: 20px; padding: 10px; background-color: #f5f5f5; border-radius: 5px;"></div>
        `;

        // Add event listeners
        document.getElementById('testStoreBtn').addEventListener('click', () => testApiEndpoint('store'));
        document.getElementById('testSearchBtn').addEventListener('click', () => testApiEndpoint('search'));
        document.getElementById('testSummarizeBtn').addEventListener('click', () => testApiEndpoint('summarize'));
        document.getElementById('testDirectBackendBtn').addEventListener('click', testDirectBackend);
        document.getElementById('pingBackendBtn').addEventListener('click', pingBackend);
        document.getElementById('testGatewayBtn').addEventListener('click', testGateway);
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

// Update the testDirectBackend function
async function testDirectBackend() {
    const resultsDiv = document.getElementById('apiTestResults');
    resultsDiv.innerHTML = `<p>Testing API Gateway connection...</p>`;
    
    try {
        // Get the current user's ID token
        const token = await auth.currentUser.getIdToken(true);
        
        // Use the API Gateway URL with proper authentication
        const url = `${baseUrl}/store?key=${apiKey}`;
        
        console.log("Attempting to connect to:", url);
        
        const response = await fetch(url, {
            method: 'GET',
            mode: 'no-cors',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log("API Gateway test response:", response);
        resultsDiv.innerHTML += `
            <p>API Gateway responded! (no-cors mode)</p>
            <p>Status: ${response.status}</p>
            <p>Note: With no-cors mode, we can't access the response content.</p>
        `;
    } catch (error) {
        console.error("API Gateway test error:", error);
        resultsDiv.innerHTML += `<p style="color:red">Error: ${error.message}</p>`;
    }
}

// Update the testApiEndpoint function
async function testApiEndpoint(endpoint) {
    const resultsDiv = document.getElementById('apiTestResults');
    resultsDiv.innerHTML = `<p>Testing ${endpoint} endpoint...</p>`;
    
    try {
        // Get the current user's ID token
        const token = await auth.currentUser.getIdToken(true);
        
        let response;
        let url = `${baseUrl}/${endpoint}?key=${apiKey}`;
        
        console.log(`Sending request to: ${url}`);
        
        if (endpoint === 'search') {
            // GET request for search
            response = await fetch(url, {
                method: 'GET',
                mode: 'no-cors',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } else if (endpoint === 'store') {
            // POST request for store
            const formData = new FormData();
            formData.append('user_id', 123);
            formData.append('date', getCurrentDate());
            formData.append('month', new Date().toLocaleString('default', { month: 'long' }));
            formData.append('year', new Date().getFullYear().toString());
            
            // Create a file for conversation
            const conversationBlob = new Blob(
                ["This is a test conversation to store."], 
                { type: 'text/plain' }
            );
            formData.append('conversation', conversationBlob, 'conversation.txt');
            
            response = await fetch(url, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Don't set Content-Type when using FormData
                },
                body: formData
            });
        } else if (endpoint === 'summarize') {
            // POST request for summarize
            const testData = {
                conversation: "This is a test conversation to summarize."
            };
            
            response = await fetch(url, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testData)
            });
        }
        
        console.log(`${endpoint} response:`, response);
        
        // With no-cors mode, we can't access response content
        resultsDiv.innerHTML = `
            <h4>${endpoint.toUpperCase()} Test Results (no-cors mode):</h4>
            <p>Status: ${response.status}</p>
            <p>Type: ${response.type}</p>
            <p>Note: With no-cors mode, we can't read the response content directly.</p>
        `;
    } catch (error) {
        console.error(`Error testing ${endpoint}:`, error);
        resultsDiv.innerHTML = `
            <h4>${endpoint.toUpperCase()} Test Error:</h4>
            <p style="color: red;">${error.message}</p>
            <p>Check the browser console for more details</p>
        `;
    }
}

// Helper function to get current date in DD-MM-YYYY format
function getCurrentDate() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    
    return `${day}-${month}-${year}`;
}

// Update pingBackend function
async function pingBackend() {
    const resultsDiv = document.getElementById('apiTestResults');
    resultsDiv.innerHTML = `<p>Pinging API Gateway...</p>`;
    
    try {
        const token = await auth.currentUser.getIdToken(true);
        console.log("Pinging:", `${baseUrl}/store?key=${apiKey}`);
        
        const response = await fetch(`${baseUrl}/store?key=${apiKey}`, {
            method: 'GET',
            mode: 'no-cors',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        resultsDiv.innerHTML += `<p>API Gateway responded! (no-cors mode)</p>`;
        console.log("API Gateway ping response:", response);
    } catch (error) {
        resultsDiv.innerHTML += `<p style="color:red">Error: ${error.message}</p>`;
        console.error("API Gateway ping error:", error);
    }
}

// Update testGateway function
async function testGateway() {
    const resultsDiv = document.getElementById('apiTestResults');
    resultsDiv.innerHTML = `<p>Testing API Gateway connection with OPTIONS...</p>`;
    
    try {
        const token = await auth.currentUser.getIdToken(true);
        console.log("Token:", token);
        console.log("Testing OPTIONS:", `${baseUrl}/store?key=${apiKey}`);
        
        const response = await fetch(`${baseUrl}/store?key=${apiKey}`, {
            method: 'OPTIONS',
            mode: 'no-cors',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        resultsDiv.innerHTML += `<p>API Gateway responded! (no-cors mode)</p>`;
        console.log("API Gateway OPTIONS response:", response);
    } catch (error) {
        resultsDiv.innerHTML += `<p style="color:red">Error: ${error.message}</p>`;
        console.error("API Gateway OPTIONS error:", error);
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