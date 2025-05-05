<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <button class="modal-close-button" @click="closeModal">&times;</button>
      <h3>Login Required</h3>
      <p>You need to be logged in to access this page.</p>
      <div class="modal-actions">
        <button class="button cancel-button" @click="closeModal">Cancel</button>
        <button class="button login-button" @click="requestLogin">
            <span class="google-icon"></span> <!-- Placeholder for Google icon -->
            Login with Google
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['close', 'login']);

function closeModal() {
  emit('close');
}

function requestLogin() {
  emit('login');
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6); /* Darker overlay */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* Ensure modal is on top */
}

.modal-content {
  background-color: #fff;
  padding: 25px 30px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 400px; /* Limit max width */
  text-align: center;
  position: relative; /* For close button positioning */
  animation: slide-down 0.3s ease-out; /* Add subtle animation */
}

@keyframes slide-down {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}


.modal-close-button {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    font-size: 1.8em; /* Larger close icon */
    line-height: 1;
    color: #aaa;
    cursor: pointer;
    padding: 0;
}
.modal-close-button:hover {
    color: #333;
}


.modal-content h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
  font-size: 1.4em;
}

.modal-content p {
  margin-bottom: 25px;
  color: #555;
  font-size: 1em;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  flex-direction: column; /* Stack vertically */
  align-items: stretch; /* Make buttons fill width */
  gap: 10px; /* Adjust gap for vertical stacking */
}

.button {
    padding: 10px 20px;
    border-radius: 6px;
    border: none;
    font-size: 0.95em;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease, box-shadow 0.2s ease;
    display: inline-flex; /* Align icon and text */
    align-items: center;
    justify-content: center;
    gap: 8px; /* Space between icon and text */
}

.cancel-button {
    background-color: #f8f9fa; /* Light grey */
    color: #333;
    border: 1px solid #dee2e6;
}
.cancel-button:hover {
    background-color: #e9ecef;
}


.login-button {
    background-color: #4285F4; /* Google Blue */
    color: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.login-button:hover {
    background-color: #357ae8;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* Basic Google icon placeholder - Replace with actual SVG/Icon font */
.google-icon {
    display: inline-block;
    width: 18px;
    height: 18px;
    background-color: #fff; /* White background */
    border-radius: 50%; /* Circle */
    /* Add multi-color segments or G logo via background image/SVG */
    background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2218%22%20height%3D%2218%22%20viewBox%3D%220%200%2018%2018%22%3E%3Cpath%20fill%3D%22%234285F4%22%20d%3D%22M17.64%209.2045c0-.638-.057-1.251-.164-1.8409H9v3.481h4.844c-.209%201.125-.843%202.078-1.796%202.717v2.258h2.908c1.702-1.567%202.684-3.874%202.684-6.616z%22/%3E%3Cpath%20fill%3D%22%2334A853%22%20d%3D%22M9%2018c2.43%200%204.467-.806%205.956-2.18l-2.908-2.258c-.806.54-1.836.859-2.948.859-2.276%200-4.186-1.536-4.868-3.59H.957v2.332C2.438%2016.145%205.48%2018%209%2018z%22/%3E%3Cpath%20fill%3D%22%23FBBC05%22%20d%3D%22M4.132%2010.79c-.19-.57-.302-1.177-.302-1.79s.112-1.22.302-1.79V4.88H.957C.347%206.17%200%207.55%200%209s.347%202.83.957%204.118l3.175-2.328z%22/%3E%3Cpath%20fill%3D%22%23EA4335%22%20d%3D%22M9%203.58c1.321%200%202.508.454%203.44%201.345l2.582-2.58C13.463.891%2011.426%200%209%200%205.48%200%202.438%201.855.957%204.88L4.132%207.21C4.814%205.117%206.724%203.58%209%203.58z%22/%3E%3C/svg%3E');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
}

</style> 