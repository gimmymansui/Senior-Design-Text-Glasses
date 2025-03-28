import { writable } from "svelte/store";

export const notificationStore = writable([])

/**
 * Creates a new notification to the svelte notification store
 * @param {Object} newNotification
 * @param {Object} newNotification.header
 * @param {Object} newNotification.message
 */
export const addNotification = (newNotification) => {
    notificationStore.update(notification => {
      // Mark previous subtitles as "previous"
      const updatedNotification = notification.map(notification => ({
        ...notification, // Spread 
        isPrevious: true
      }));
      
      // Add new subtitle
      const allNotifications = [...updatedNotification, {
        ...newNotification,
        isPrevious: false
      }];
      
      // Keep only last 2 notifications
      return allNotifications.slice(-2);
    });
  };