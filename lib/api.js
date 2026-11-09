"use client";

const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const USER_EVENT = "jarvis-user-change";

function subscribeToStorage(eventName, callback) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(eventName, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(eventName, callback);
  };
}

export function getStoredBaseUrl() {
  return DEFAULT_BASE_URL;
}

export function getStoredUserSnapshot() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("jarvis_user") || "";
}

export function subscribeToStoredUser(callback) {
  return subscribeToStorage(USER_EVENT, callback);
}

export function setStoredUser(user) {
  if (typeof window !== "undefined") {
    if (user) {
      localStorage.setItem("jarvis_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("jarvis_user");
    }
    window.dispatchEvent(new Event(USER_EVENT));
  }
}

export async function jarvisFetch(endpoint, options = {}) {
  const baseUrl = getStoredBaseUrl();
  const method = options.method || "GET";
  const hasBody = options.body !== undefined;

  // Route through Next.js so backend cookies stay same-origin in the browser.
  const proxyEndpoint = `/api/backend${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;

  const headers = {
    ...(options.headers || {}),
  };

  if (hasBody && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  let response;
  try {
    response = await fetch(proxyEndpoint, {
      method,
      headers,
      credentials: "include",
      body: hasBody ? (typeof options.body === "string" ? options.body : JSON.stringify(options.body)) : undefined,
    });
  } catch (netErr) {
    throw new Error(`Network failure connecting to proxy: ${netErr.message}`);
  }

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

// API methods
export const api = {
  async login(appId, password) {
    const res = await jarvisFetch("/auth/login", {
      method: "POST",
      body: { appId, password },
    });
    if (res?.app) {
      setStoredUser(res.app);
    }
    return res;
  },

  async logout() {
    try {
      await jarvisFetch("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      setStoredUser(null);
    }
  },

  async getMetrics() {
    return jarvisFetch("/dashboard/metrics");
  },

  async getServices() {
    return jarvisFetch("/dashboard/services");
  },

  async getRecentEvents(limit = 25) {
    return jarvisFetch(`/dashboard/events/recent?limit=${limit}`);
  },
};
