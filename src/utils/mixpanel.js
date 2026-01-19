import mixpanel from "mixpanel-browser";

// Initialize Mixpanel
mixpanel.init('cf1f668e1549af468c16347e5707e073', {
  autocapture: true,
  record_sessions_percent: 100,
});

// Export Mixpanel instance and helper functions
export const trackEvent = (eventName, properties = {}) => {
  try {
    mixpanel.track(eventName, properties);
  } catch (error) {
    console.error('Mixpanel tracking error:', error);
  }
};

export const identifyUser = (userId) => {
  try {
    mixpanel.identify(userId);
  } catch (error) {
    console.error('Mixpanel identify error:', error);
  }
};

export const setUserProperties = (properties) => {
  try {
    mixpanel.people.set(properties);
  } catch (error) {
    console.error('Mixpanel set user properties error:', error);
  }
};

export default mixpanel;

