<template>
  <div class="container-page">
    <div class="support-title">Support Center</div>

    <div class="support-options">
        <!-- TODO: Make these interactive if needed -->
        <div class="support-option">
            <i class="fas fa-book"></i>
            <h3>Documentation</h3>
            <p>Browse our extensive documentation for detailed instructions and guides.</p>
        </div>
        <div class="support-option">
            <i class="fas fa-comment-alt"></i>
            <h3>Live Chat</h3>
            <p>Connect with a support agent for real-time assistance.</p>
        </div>
        <div class="support-option">
            <i class="fas fa-envelope"></i>
            <h3>Email Support</h3>
            <p>Send us an email and we'll get back to you within 24 hours.</p>
        </div>
        <div class="support-option">
            <i class="fas fa-question-circle"></i>
            <h3>FAQ</h3>
            <p>Find answers to commonly asked questions about our products.</p>
        </div>
        <div class="support-option">
            <i class="fas fa-cogs"></i>
            <h3>Troubleshooting</h3>
            <p>Follow our step-by-step guides to resolve common issues.</p>
        </div>
        <div class="support-option">
            <i class="fas fa-video"></i>
            <h3>Video Tutorials</h3>
            <p>Watch detailed tutorials on how to use your smart glasses.</p>
        </div>
    </div>

    <button class="return-button" @click="goHome">Return to Home</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

function goHome() {
    router.push('/');
}
</script>

<style scoped>
/* Copy relevant styles from pages.css and style.css for support page */
.container-page {
  padding: 20px;
  max-width: 950px; /* Wider for grid */
  margin: 20px auto;
}

.support-title {
  font-size: 1.8em;
  font-weight: bold;
  margin-bottom: 30px;
  text-align: center;
  color: #333;
}

.support-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); /* Responsive grid */
  gap: 25px;
  margin-bottom: 30px;
}

.support-option {
  background-color: #fff;
  border-radius: 8px;
  padding: 25px;
  text-align: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer; /* Add cursor if options are clickable */
}

.support-option:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

.support-option i {
  font-size: 2.5em; /* Adjust icon size */
  color: #007bff; /* Theme color */
  margin-bottom: 15px;
}

.support-option h3 {
  font-size: 1.2em;
  margin-bottom: 10px;
  color: #444;
}

.support-option p {
  color: #666;
  font-size: 0.95em;
  line-height: 1.4;
}


.return-button {
    display: block;
    margin: 20px auto 0;
    padding: 10px 20px;
    cursor: pointer;
}
</style> 