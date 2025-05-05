<template>
  <div class="container-page">
    <div class="glasses-title">Glasses Status</div>

     <!-- TODO: Bind data dynamically -->
    <div class="status-grid">

        <div class="status-card">
            <h3>Connectivity</h3>
            <div class="status-item">
                <span class="label">Bluetooth</span>
                <span>Connected <span class="status-indicator green"></span></span>
            </div>
            <div class="status-item">
                <span class="label">Wi-Fi</span>
                <span>Connected <span class="status-indicator green"></span></span>
            </div>
            <div class="status-item">
                <span class="label">Signal Strength</span>
                <span>Excellent</span>
            </div>
        </div>

        <div class="status-card">
            <h3>Battery</h3>
            <div class="status-item">
                <span class="label">Current Level</span>
                <span>87% <span class="status-indicator green"></span></span>
            </div>
            <div class="status-item">
                <span class="label">Charging Status</span>
                <span>Not Charging</span>
            </div>
            <div class="status-item">
                <span class="label">Estimated Runtime</span>
                <span>4h 23m</span>
            </div>
        </div>
    </div>

    <button class="return-button" @click="goHome">Return to Home</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
// TODO: Import refs/methods for fetching status data

const router = useRouter();

function goHome() {
    router.push('/');
}

// TODO: Add logic to fetch and update status details
</script>

<style scoped>
/* Copy relevant styles from pages.css/style.css */
.container-page {
  padding: 20px;
  max-width: 1000px; /* Adjust as needed */
  margin: 20px auto;
}

.glasses-title {
  font-size: 1.8em;
  font-weight: bold;
  margin-bottom: 30px;
  text-align: center;
  color: #333;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); /* Responsive grid */
  gap: 20px;
  margin-bottom: 30px;
}

.status-card {
  background-color: #fff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.status-card h3 {
  font-size: 1.2em;
  margin-top: 0;
  margin-bottom: 15px;
  color: #495057;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 0.95em;
}

.status-item .label {
  color: #6c757d;
  margin-right: 10px;
}

.status-item span:last-child {
  font-weight: 500;
  color: #343a40;
  display: inline-flex; /* Align indicator */
  align-items: center;
}

.status-indicator {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-left: 8px;
}

.status-indicator.green { background-color: #28a745; }
.status-indicator.yellow { background-color: #ffc107; }
.status-indicator.red { background-color: #dc3545; }


.return-button {
    display: block;
    margin: 20px auto 0;
    padding: 10px 20px;
    cursor: pointer;
}

</style> 