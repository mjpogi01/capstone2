import { supabase } from '../lib/supabase';

async function getAccessToken() {
  const {
    data: { session },
    error
  } = await supabase.auth.getSession();

  if (error) {
    console.error('Failed to retrieve Supabase session:', error);
    throw new Error('Unable to retrieve authentication session');
  }

  if (!session?.access_token) {
    throw new Error('User not authenticated');
  }

  return session.access_token;
}

export async function authFetch(url, options = {}) {
  const token = await getAccessToken();

  const mergedHeaders = {
    ...(options.headers || {}),
    Authorization: options.headers?.Authorization || `Bearer ${token}`
  };

  return fetch(url, {
    ...options,
    headers: mergedHeaders
  });
}

export async function authJsonFetch(url, options = {}) {
  const response = await authFetch(url, options);

  let payload = null;
  try {
    payload = await response.json();
  } catch (err) {
    console.warn('authJsonFetch: response parsing failed, returning empty payload');
  }

  if (!response.ok) {
    const error = new Error(payload?.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

