import { createRouter, createWebHashHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Transcriptions from '../views/Transcriptions.vue';
import Account from '../views/Account.vue';
import Settings from '../views/Settings.vue';
import Support from '../views/Support.vue';
import InternetConnection from '../views/InternetConnection.vue';
import GlassesStatus from '../views/GlassesStatus.vue';
import GlassesBattery from '../views/GlassesBattery.vue';
import TranscriptionDetail from '../views/TranscriptionDetail.vue';

// Import authentication composable and UI state
import { useAuth } from '../composables/useAuth';
import { uiState } from '../store/uiStore';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/transcriptions',
    name: 'Transcriptions',
    component: Transcriptions,
    meta: { requiresAuth: true }
  },
  {
    path: '/transcriptions/:id',
    name: 'TranscriptionDetail',
    component: TranscriptionDetail,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/account',
    name: 'Account',
    component: Account,
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
  },
  {
    path: '/support',
    name: 'Support',
    component: Support,
  },
  {
    path: '/internet',
    name: 'InternetConnection',
    component: InternetConnection,
  },
  {
    path: '/status',
    name: 'GlassesStatus',
    component: GlassesStatus,
  },
  {
    path: '/battery',
    name: 'GlassesBattery',
    component: GlassesBattery,
  },
  // Add other routes here
];

const router = createRouter({
  history: createWebHashHistory(), // Using hash mode for simplicity
  routes,
});

// Navigation Guard
router.beforeEach((to, from, next) => {
  // Get the currentUser value from the composable at the time of navigation
  // NOTE: This relies on the composable being initialized and holding the correct state.
  // For more complex scenarios (e.g., waiting for Firebase auth to initialize),
  // a more sophisticated approach might be needed (like an initialization flag).
  const { currentUser } = useAuth(); 

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (requiresAuth && !currentUser.value) {
    console.log('Navigation blocked: Route requires auth and user is not logged in.');
    uiState.showLoginModal = true; // Show the login prompt modal
    next(false); // Prevent navigation
  } else {
    uiState.showLoginModal = false; // Ensure modal is hidden if navigation is allowed
    next(); // Allow navigation
  }
});

export default router; 