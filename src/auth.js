let _tokenClient = null;
let _accessToken = null;

export function initAuth(clientId, loginHint = '') {
  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services is not loaded yet. Ensure the GIS script has loaded before calling initAuth.');
  }
  _tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: 'https://www.googleapis.com/auth/spreadsheets email',
    hint: loginHint || undefined,
    callback: ''
  });
}

export function waitForGIS(timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const interval = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        clearInterval(interval);
        clearTimeout(timeout);
        resolve();
      }
    }, 100);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      reject(new Error('Google Identity Services failed to load within the timeout period.'));
    }, timeoutMs);
  });
}

export function requestToken() {
  return new Promise((resolve, reject) => {
    _tokenClient.callback = (response) => {
      if (response.error) {
        reject(response.error);
      } else {
        _accessToken = response.access_token;
        resolve(_accessToken);
      }
    };
    _tokenClient.requestAccessToken();
  });
}

export function silentRequestToken() {
  return Promise.resolve(null);
}

export function getToken() {
  return _accessToken;
}

export async function fetchUserEmail(token) {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.email ?? null;
  } catch {
    return null;
  }
}
