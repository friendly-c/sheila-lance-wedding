/**
 * RSVP transport configuration.
 * Keep this file in the public website; it contains no secrets.
 * Leave mode as "mock" until the Apps Script web app has been deployed and tested.
 */
export const rsvpConfig = {
  mode: "apps-script", // "mock" or "apps-script"
  appsScriptUrl: "https://script.google.com/macros/s/AKfycby7HuFAtowDRem6uRiOwOYWQmHeyJimkWAoByfAIuToDJWHxCVGtQ_Aq_n1Zex8HOTa/exec", // the deployed Apps Script URL
  requestTimeoutMs: 25000,
};
