<template>
  <div class="container-page">
    <div class="battery-title">Glasses Battery</div>

     <!-- TODO: Bind data dynamically -->
    <div class="battery-info">
        <div class="battery-detail">
            <h3>Current Status</h3>
            <p>Battery Level: 87%</p>
            <p>Charging: No</p>
            <p>Estimated Time Remaining: 4h 23m</p>
        </div>
        <div class="battery-detail">
            <h3>Battery Health</h3>
            <p>Cycle Count: 42</p>
            <p>Capacity: 95%</p>
            <p>Last Charged: March 27, 2025</p>
        </div>
        <div class="battery-detail">
            <h3>Power Consumption</h3>
            <p>Average Usage: 0.4W</p>
            <p>Current Draw: 0.2W</p>
            <p>Power Mode: Normal</p>
        </div>
        <div class="battery-detail">
            <h3>Charging Information</h3>
            <p>Charger Type: USB-C</p>
            <p>Charging Speed: Fast Charge</p>
            <p>Full Charge Time: ~1h 15m</p>
        </div>
    </div>

    <button class="return-button" @click="goHome">Return to Home</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
// TODO: Import refs/methods for fetching battery data

const router = useRouter();

function goHome() {
    router.push('/');
}

// TODO: Add logic to fetch and update battery details
</script>

<style scoped>
/* Copy relevant styles from pages.css/style.css */
.container-page {
  padding: 20px;
  max-width: 900px; /* Adjust as needed */
  margin: 20px auto;
}

.battery-title {
  font-size: 1.8em;
  font-weight: bold;
  margin-bottom: 30px;
  text-align: center;
  color: #333;
}

.battery-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); /* Responsive grid */
  gap: 20px;
  margin-bottom: 30px;
}

.battery-detail {
  background-color: #f8f9fa;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 20px;
}

.battery-detail h3 {
  font-size: 1.1em;
  margin-top: 0;
  margin-bottom: 15px;
  color: #495057;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 10px;
}

.battery-detail p {
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