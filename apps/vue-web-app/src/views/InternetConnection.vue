<template>
  <div class="container-page">
    <div class="connection-title">Internet Connection</div>

    <!-- TODO: Bind status to actual data -->
    <div class="connection-status">
        Connected
    </div>

    <div class="connection-details">
         <!-- TODO: Bind details to actual data -->
        <div class="connection-detail">
            <h3>Wi-Fi Details</h3>
            <p>Status: Connected</p>
            <p>Network: OptiNet_2.4G</p>
            <p>Signal Strength: Excellent</p>
            <p>IP Address: 192.168.1.105</p>
        </div>
        <div class="connection-detail">
            <h3>Connection Quality</h3>
            <p>Download Speed: 150 Mbps</p>
            <p>Upload Speed: 50 Mbps</p>
            <p>Latency: 15ms</p>
            <p>Last Test: Today, 2:45 PM</p>
        </div>
        <div class="connection-detail">
            <h3>Data Usage</h3>
            <p>Today: 120 MB</p>
            <p>This Week: 1.2 GB</p>
            <p>This Month: 3.5 GB</p>
            <p>Mode: Standard Quality</p>
        </div>
        <div class="connection-detail">
            <h3>Network Options</h3>
            <p>Auto-Connect: Enabled</p>
            <p>Preferred Networks: 3</p>
            <p>Security: WPA3</p>
            <p>MAC Address: 00:1A:2B:3C:4D:5E</p>
        </div>
    </div>

    <button class="return-button" @click="goHome">Return to Home</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
// TODO: Import refs/methods for fetching connection data

const router = useRouter();

function goHome() {
    router.push('/');
}

// TODO: Add logic to fetch and update connection status/details
</script>

<style scoped>
/* Copy relevant styles from pages.css/style.css */
.container-page {
  padding: 20px;
  max-width: 900px; /* Adjust as needed */
  margin: 20px auto;
}

.connection-title {
  font-size: 1.8em;
  font-weight: bold;
  margin-bottom: 25px;
  text-align: center;
  color: #333;
}

.connection-status {
  font-size: 1.4em;
  font-weight: bold;
  text-align: center;
  padding: 15px;
  background-color: #d4edda; /* Green for connected example */
  color: #155724; /* Dark green text */
  border: 1px solid #c3e6cb;
  border-radius: 8px;
  margin-bottom: 30px;
  /* Add styles for other statuses (disconnected, connecting) */
}

.connection-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); /* Responsive grid */
  gap: 20px;
  margin-bottom: 30px;
}

.connection-detail {
  background-color: #f8f9fa;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 20px;
}

.connection-detail h3 {
  font-size: 1.1em;
  margin-top: 0;
  margin-bottom: 15px;
  color: #495057;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 10px;
}

.connection-detail p {
  margin: 8px 0;
  color: #6c757d;
  font-size: 0.95em;
}

.return-button {
    display: block;
    margin: 20px auto 0;
    padding: 10px 20px;
    cursor: pointer;
}
</style> 