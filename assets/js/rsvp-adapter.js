/**
 * RSVP integration boundary.
 *
 * Mock mode uses fictional records and localStorage only. Apps Script mode uses
 * JSONP for cross-origin reads and a regular form POST for submission, followed
 * by a request-ID status poll. No credentials or spreadsheet IDs are stored here.
 */
import { mockInvitations } from "./mock-invitations.js";
import { rsvpConfig } from "./rsvp-config.js";

const STORAGE_PREFIX = "wedding-rsvp-prototype:";
const DEFAULT_MEALS = [
  { course: "starter", code: "burrata-tomato", label: "Burrata, heritage tomato & basil (vegetarian)", guestType: "ADULT" },
  { course: "starter", code: "roasted-tomato-soup", label: "Roasted tomato soup (vegan)", guestType: "ADULT" },
  { course: "starter", code: "child-fruit-sticks", label: "Fruit and vegetable sticks (sample child menu)", guestType: "CHILD" },
  { course: "main", code: "roast-veg", label: "Roast squash, crispy sage & lentils (vegan)", guestType: "ADULT" },
  { course: "main", code: "chicken", label: "Lemon thyme chicken, potatoes & greens", guestType: "ADULT" },
  { course: "main", code: "fish", label: "Herb-baked fish, buttery new potatoes", guestType: "ADULT" },
  { course: "main", code: "child-chicken-goujons", label: "Chicken goujons, chips & peas (sample child menu)", guestType: "CHILD" },
  { course: "main", code: "child-macaroni-cheese", label: "Macaroni cheese (sample child menu)", guestType: "CHILD" },
  { course: "dessert", code: "lemon-posset", label: "Lemon posset with berry compote", guestType: "ADULT" },
  { course: "dessert", code: "chocolate-torte", label: "Dark chocolate torte (vegan)", guestType: "ADULT" },
  { course: "dessert", code: "child-ice-cream", label: "Ice cream (sample child menu)", guestType: "CHILD" },
];

export const isMockMode = rsvpConfig.mode !== "apps-script";

function storageKey(token) {
  return `${STORAGE_PREFIX}${token}`;
}

function configuredEndpoint() {
  const endpoint = String(rsvpConfig.appsScriptUrl || "").trim();
  if (!endpoint) throw new Error("Apps Script endpoint is not configured.");
  const parsed = new URL(endpoint);
  if (parsed.protocol !== "https:" || !/script\.google\.com$/.test(parsed.hostname) || !/\/macros\/s\/[^/]+\/exec$/.test(parsed.pathname)) {
    throw new Error("Apps Script endpoint must be a deployed https://script.google.com/macros/s/.../exec URL.");
  }
  return parsed;
}

export async function loadInvitation(token) {
  if (!isMockMode) {
    try {
      if (!token) return { ok: false, reason: "not-found" };
      const result = await jsonp({ action: "invitation", token }, 10000);
      if (!result?.ok) return result || { ok: false, reason: "unavailable" };
      return result;
    } catch {
      return { ok: false, reason: "unavailable" };
    }
  }

  if (!token || !Object.prototype.hasOwnProperty.call(mockInvitations, token)) {
    return { ok: false, reason: "not-found" };
  }

  const invitation = mockInvitations[token];
  let saved = null;
  try {
    const raw = window.localStorage.getItem(storageKey(token));
    saved = raw ? JSON.parse(raw) : null;
  } catch {
    saved = null;
  }

  return {
    ok: true,
    invitation: {
      ...structuredCloneSafe(invitation),
      mealOptions: DEFAULT_MEALS,
    },
    submitted: Boolean(saved?.submittedAt),
    savedResponse: saved?.response ?? null,
  };
}

export async function submitRsvp(token, response) {
  if (!isMockMode) return submitToAppsScript(token, response);

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
    return { ok: true, reference: "DEMO-SESSION", storageUnavailable: true };
  }
}

async function submitToAppsScript(token, response) {
  if (!token) return { ok: false, reason: "not-found" };
  const requestId = randomRequestId();
  let transport;
  try {
    transport = postFormToAppsScript({
      action: "submitRsvp",
      token,
      requestId,
      payload: JSON.stringify(response),
    });
  } catch {
    return { ok: false, reason: "unavailable" };
  }

  const timeoutMs = Math.max(8000, Number(rsvpConfig.requestTimeoutMs) || 25000);
  const deadline = Date.now() + timeoutMs;
  try {
    while (Date.now() < deadline) {
      await wait(1200);
      try {
        const status = await jsonp({ action: "status", token, requestId }, 7000);
        if (status?.ok && status.submitted && status.requestMatched) {
          return { ok: true, reference: status.reference };
        }
        if (status?.reason === "already-submitted") return { ok: false, reason: "already-submitted" };
        if (status?.reason === "not-found") return { ok: false, reason: "not-found" };
        if (status?.reason && status.reason !== "not-submitted") return { ok: false, reason: status.reason };
      } catch {
        // A transient polling error should not cause a duplicate submission.
      }
    }
    return { ok: false, reason: "timeout" };
  } finally {
    transport.cleanup();
  }
}

function postFormToAppsScript(fields) {
  const endpoint = configuredEndpoint();
  const frameName = `rsvp-submit-frame-${randomRequestId()}`;
  const frame = document.createElement("iframe");
  frame.name = frameName;
  frame.title = "Background RSVP submission";
  frame.setAttribute("aria-hidden", "true");
  frame.tabIndex = -1;
  frame.style.position = "absolute";
  frame.style.width = "1px";
  frame.style.height = "1px";
  frame.style.opacity = "0";
  frame.style.pointerEvents = "none";
  frame.style.border = "0";

  const form = document.createElement("form");
  form.method = "POST";
  form.action = endpoint.toString();
  form.target = frameName;
  form.acceptCharset = "UTF-8";
  form.style.display = "none";
  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = String(value);
    form.appendChild(input);
  });

  document.body.append(frame, form);
  try {
    form.submit();
  } catch (error) {
    form.remove();
    frame.remove();
    throw error;
  }
  return { cleanup: () => { form.remove(); frame.remove(); } };
}

function jsonp(params, timeoutMs = 10000) {
  const endpoint = configuredEndpoint();
  return new Promise((resolve, reject) => {
    const callbackName = `rsvpJsonp_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
    let done = false;
    const script = document.createElement("script");
    const url = new URL(endpoint.toString());
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
    url.searchParams.set("callback", callbackName);
    script.async = true;
    script.referrerPolicy = "no-referrer";

    const cleanup = () => {
      window.clearTimeout(timeout);
      script.onerror = null;
      script.onload = null;
      script.remove();
      try { delete window[callbackName]; } catch { window[callbackName] = undefined; }
    };
    const finish = (fn, value) => {
      if (done) return;
      done = true;
      cleanup();
      fn(value);
    };
    const timeout = window.setTimeout(() => finish(reject, new Error("RSVP service timed out.")), timeoutMs);
    window[callbackName] = (data) => finish(resolve, data);
    script.onerror = () => finish(reject, new Error("RSVP service could not be reached."));
    script.onload = () => {
      // JSONP callback should have run before load. A missing callback will time out.
    };
    script.src = url.toString();
    document.head.appendChild(script);
  });
}

function randomRequestId() {
  const bytes = new Uint8Array(24);
  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
}

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export async function resetMockRsvp(token) {
  try { window.localStorage.removeItem(storageKey(token)); } catch { /* test helper */ }
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}
