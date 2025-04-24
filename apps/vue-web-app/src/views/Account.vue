<template>
  <div class="container-page">
    <div class="account-title">My Account</div>

    <!-- Profile Section - Needs data binding -->
    <div class="profile-section" v-if="currentUser">
        <img v-if="currentUser.photoURL" :src="currentUser.photoURL" alt="Profile" class="profile-image">
        <h2 class="profile-name">{{ currentUser.displayName || 'User' }}</h2>
        <p class="profile-email">{{ currentUser.email || 'No email provided' }}</p>
    </div>
     <div v-else class="profile-section">
         <p>Loading user information or not logged in...</p>
     </div>

    <div class="account-container">
        <!-- TODO: Make these sections interactive -->
        <div class="account-card">
            <h3>Account Settings</h3>
            <div class="account-action">
                <span>Security & Privacy</span>
                <i class="fas fa-chevron-right"></i>
            </div>
            <div class="account-action">
                <span>Linked Accounts</span>
                <i class="fas fa-chevron-right"></i>
            </div>
            <div class="account-action">
                <span>Language Preferences</span>
                <i class="fas fa-chevron-right"></i>
            </div>
        </div>
    </div>

    <button class="return-button" @click="goHome">Return to Home</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const { currentUser } = useAuth(); // Get user data

function goHome() {
    router.push('/');
}

// TODO: Add methods for handling clicks on account actions
</script>

<style scoped>
/* Copy relevant styles from pages.css and style.css for account page */
.container-page {
  padding: 20px;
  max-width: 900px; /* Adjust width as needed */
  margin: 20px auto;
}

.account-title {
  font-size: 1.8em;
  font-weight: bold;
  margin-bottom: 30px;
  text-align: center;
  color: #333;
}

.profile-section {
  text-align: center;
  margin-bottom: 40px;
}

.profile-image {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 15px;
  border: 3px solid #eee;
}

.profile-name {
  font-size: 1.5em;
  margin-bottom: 5px;
  color: #333;
}

.profile-email {
  color: #777;
  font-size: 1em;
}

.account-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); /* Responsive grid */
  gap: 20px;
  margin-bottom: 30px;
}

.account-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.account-card h3 {
  font-size: 1.2em;
  margin-top: 0;
  margin-bottom: 15px;
  color: #444;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.account-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  cursor: pointer;
  color: #555;
  border-bottom: 1px solid #f5f5f5;
  transition: color 0.2s ease;
}
.account-action:last-child {
    border-bottom: none;
}

.account-action:hover {
    color: #007bff; /* Highlight on hover */
}

.account-action i {
    color: #aaa;
    transition: color 0.2s ease;
}
.account-action:hover i {
    color: #007bff;
}


.return-button {
    display: block;
    margin: 20px auto 0;
    padding: 10px 20px;
    cursor: pointer;
}

</style> 