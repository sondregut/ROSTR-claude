import * as WebBrowser from 'expo-web-browser';

const FEATUREBASE_BASE_URL = 'https://rostrdating.featurebase.app';

interface UserData {
  name?: string;
  email?: string;
  id?: string;
}

/**
 * Opens the Featurebase feature request form
 * Pre-fills user data if available
 */
export async function openFeatureRequest(userData?: UserData) {
  let url = FEATUREBASE_BASE_URL;
  
  // Add user data as query parameters if available
  if (userData) {
    const params = new URLSearchParams();
    if (userData.name) params.append('name', userData.name);
    if (userData.email) params.append('email', userData.email);
    if (userData.id) params.append('userId', userData.id);
    
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  
  await WebBrowser.openBrowserAsync(url);
}

/**
 * Opens the Featurebase bug report form
 * Pre-fills user data if available
 */
export async function openBugReport(userData?: UserData) {
  let url = `${FEATUREBASE_BASE_URL}/submit/bug`;
  
  // Add user data as query parameters if available
  if (userData) {
    const params = new URLSearchParams();
    if (userData.name) params.append('name', userData.name);
    if (userData.email) params.append('email', userData.email);
    if (userData.id) params.append('userId', userData.id);
    
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  
  await WebBrowser.openBrowserAsync(url);
}

/**
 * Opens the Featurebase roadmap page
 */
export async function openRoadmap() {
  const url = `${FEATUREBASE_BASE_URL}/roadmap`;
  await WebBrowser.openBrowserAsync(url);
}

/**
 * Opens the Featurebase changelog page
 */
export async function openChangelog() {
  const url = `${FEATUREBASE_BASE_URL}/changelog`;
  await WebBrowser.openBrowserAsync(url);
}

/**
 * Opens a specific feature request by ID
 */
export async function openFeatureRequestById(requestId: string) {
  const url = `${FEATUREBASE_BASE_URL}/request/${requestId}`;
  await WebBrowser.openBrowserAsync(url);
}