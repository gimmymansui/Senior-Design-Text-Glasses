import { createApp } from 'vue'
import './style.css' // Default Vite style, can be removed if not used
import './assets/normalize.css' // Import normalize CSS
import './assets/style.css' // Import main stylesheet
import App from './App.vue'
import router from './router' // Import the router

const app = createApp(App);
app.use(router); // Tell the app to use the router
app.mount('#app');
