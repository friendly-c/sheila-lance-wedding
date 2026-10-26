/**
 * RSVP data boundary.
 * The website talks only to loadInvitation() and submitRsvp(). When the real
 * Google Apps Script endpoint is ready, replace this file's implementation;
 * keep the function signatures and the rest of the RSVP UI can stay unchanged.
 *
 * This prototype uses local mock invitations and browser-local storage only.
 * No network request is made and no information is sent to a spreadsheet.
 */
import { mockInvitations } from "./mock-invitations.js";

const STORAGE_PREFIX = "wedding-rsvp-prototype:";

function storageKey(token) {
  return `${STORAGE_PREFIX}${token}`;
}

export async function loadInvitation(token) {
  if (!token || !Object.prototype.hasOwnProperty.call(mockInvitations, token)) {
    return { ok: false, reason: "not-found" };
  }

  const invitation = mockInvitations[token];
  let saved = null;
  try {
    const raw = window.localStorage.getItem(storageKey(token));
    saved = raw ? JSON.parse(raw) : null;
  } catch {
    // Storage may be disabled in private browsing. The invitation still works.
    saved = null;
  }

  return {
    ok: true,
    invitation: structuredCloneSafe(invitation),
    submitted: Boolean(saved?.submittedAt),
    savedResponse: saved?.response ?? null,
  };
}

export async function submitRsvp(token, response) {
  // Always re-check the token and lock state at the data boundary.
  if (!token || !Object.prototype.hasOwnProperty.call(mockInvitations, token)) {
    return { ok: false, reason: "not-found" };
  }

  try {
    const key = storageKey(token);
    const existing = window.localStorage.getItem(key);
    if (existing && JSON.parse(existing)?.submittedAt) {
      return { ok: false, reason: "already-submitted" };
    }

    const reference = `DEMO-${token.slice(5).replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase()}`;
    window.localStorage.setItem(key, JSON.stringify({
      submittedAt: new Date().toISOString(),
      response: { ...response, reference },
    }));
    return { ok: true, reference };
  } catch {
    // This is only a local demo. If storage is unavailable, show a confirmation
    // for this page session without pretending anything was sent to a server.
    return { ok: true, reference: "DEMO-SESSION", storageUnavailable: true };
  }
}

export async function resetMockRsvp(token) {
  // Helper for testing only; no reset control is presented to guests.
  try { window.localStorage.removeItem(storageKey(token)); } catch { /* no-op */ }
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

/*
Future Apps Script outline (illustrative only; no endpoint or secret is included):

export async function loadInvitation(token) {
  const response = await fetch(`${APPS_SCRIPT_URL}?action=invitation&token=${encodeURIComponent(token)}`);
  return response.json();
}

export async function submitRsvp(token, responseBody) {
  const response = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "submitRsvp", token, ...responseBody })
  });
  return response.json();
}

Keep URL tokens high-entropy and opaque in production. Validate token, guest membership,
allowed meal values, and one-submission locking again on the Apps Script/server side.
*/
