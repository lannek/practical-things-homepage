/**
 * Shared auth module — practical-things-homepage
 *
 * Stores the PocketBase session in a cookie scoped to .practical-things.eu
 * so all subdomains (norwegian, spanish, future apps) share the same login.
 */

import PocketBase from 'pocketbase';

const PB_URL = 'https://auth.practical-things.eu';
const COOKIE_NAME = 'pb_auth';
const COOKIE_DOMAIN = '.practical-things.eu';

export const pb = new PocketBase(PB_URL);

// ─── Cookie helpers ──────────────────────────────────────────────────────────

function setCookie(token, model) {
  const value = encodeURIComponent(JSON.stringify({ token, model }));
  const maxAge = 60 * 60 * 24 * 30; // 30 days
  document.cookie = `${COOKIE_NAME}=${value}; domain=${COOKIE_DOMAIN}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearCookie() {
  document.cookie = `${COOKIE_NAME}=; domain=${COOKIE_DOMAIN}; path=/; max-age=0`;
}

function readCookie() {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  try { return JSON.parse(decodeURIComponent(match[1])); } catch { return null; }
}

// Restore session from cookie on load
const saved = readCookie();
if (saved?.token && saved?.model) {
  pb.authStore.save(saved.token, saved.model);
}

// Keep cookie in sync with auth state
pb.authStore.onChange((token, model) => {
  if (token) setCookie(token, model);
  else clearCookie();
});

// ─── Auth actions ────────────────────────────────────────────────────────────

export async function signIn(email, password) {
  return pb.collection('users').authWithPassword(email, password);
}

export async function signUp(email, password, name) {
  await pb.collection('users').create({ email, password, passwordConfirm: password, name });
  return pb.collection('users').authWithPassword(email, password);
}

export function signOut() {
  pb.authStore.clear();
}

export function isLoggedIn() {
  return pb.authStore.isValid;
}

export function currentUser() {
  return pb.authStore.model;
}

export function onAuthChange(callback) {
  return pb.authStore.onChange((token, model) => {
    callback(!!token && pb.authStore.isValid, model);
  });
}
