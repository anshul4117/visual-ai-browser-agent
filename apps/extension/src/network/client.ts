import type { ActivityEvent, CreateScreenshotRequest, ScreenshotAnalysisRecord } from '@visual-ai/shared-types';

export const DEFAULT_BACKEND_URL = 'http://localhost:3000';
const BACKEND_URL_KEY = 'vai_backend_url';
const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Retrieve configured backend URL from chrome.storage.sync.
 * Defaults to http://localhost:3000 if unconfigured.
 */
export async function getBackendUrl(): Promise<string> {
  try {
    const data = await chrome.storage.sync.get([BACKEND_URL_KEY]);
    if (data[BACKEND_URL_KEY] && typeof data[BACKEND_URL_KEY] === 'string') {
      return data[BACKEND_URL_KEY].replace(/\/+$/, '');
    }
  } catch {
    // Fallback if chrome.storage.sync is unavailable
  }
  return DEFAULT_BACKEND_URL;
}

/**
 * Save backend URL configuration to chrome.storage.sync.
 */
export async function setBackendUrl(url: string): Promise<string> {
  const sanitizedUrl = url.trim().replace(/\/+$/, '');
  await chrome.storage.sync.set({ [BACKEND_URL_KEY]: sanitizedUrl });
  return sanitizedUrl;
}

/**
 * Fetch wrapper with timeout support via AbortController.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Check backend server connectivity and health.
 */
export async function checkServerHealth(backendUrl?: string): Promise<boolean> {
  try {
    const baseUrl = backendUrl || (await getBackendUrl());
    const healthUrl = `${baseUrl}/api/health`;

    const response = await fetchWithTimeout(healthUrl, { method: 'GET' }, 3000);
    if (!response.ok) return false;

    const data = await response.json();
    return data && data.status === 'ok';
  } catch {
    return false;
  }
}

/**
 * Transmit a single ActivityEvent to POST /api/events.
 */
export async function sendSingleEvent(
  event: ActivityEvent,
  backendUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = backendUrl || (await getBackendUrl());
    const endpoint = `${baseUrl}/api/events`;

    const response = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (response.status === 201 || response.status === 200) {
      return { success: true };
    }

    const errData = await response.json().catch(() => ({ error: 'HTTP error' }));
    return { success: false, error: errData.error || `Server responded with ${response.status}` };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Network error';
    return { success: false, error: msg };
  }
}

/**
 * Transmit a batch of ActivityEvents to POST /api/events/batch.
 */
export async function sendBatchEvents(
  events: ActivityEvent[],
  backendUrl?: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  if (events.length === 0) return { success: true, count: 0 };

  try {
    const baseUrl = backendUrl || (await getBackendUrl());
    const endpoint = `${baseUrl}/api/events/batch`;

    const response = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(events),
    });

    if (response.status === 201 || response.status === 200) {
      const resData = await response.json().catch(() => ({ count: events.length }));
      return { success: true, count: resData.count || events.length };
    }

    const errData = await response.json().catch(() => ({ error: 'HTTP error' }));
    return { success: false, error: errData.error || `Server responded with ${response.status}` };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Network error';
    return { success: false, error: msg };
  }
}

/**
 * Transmit a Screenshot payload to POST /api/screenshots.
 */
export async function sendScreenshot(
  payload: CreateScreenshotRequest,
  backendUrl?: string
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const baseUrl = backendUrl || (await getBackendUrl());
    const endpoint = `${baseUrl}/api/screenshots`;

    const response = await fetchWithTimeout(
      endpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
      15000
    );

    if (response.status === 201 || response.status === 200) {
      const resData = await response.json().catch(() => ({}));
      return { success: true, filePath: resData.filePath };
    }

    const errData = await response.json().catch(() => ({ error: 'HTTP error' }));
    return { success: false, error: errData.error || `Server responded with ${response.status}` };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Network error';
    return { success: false, error: msg };
  }
}

/**
 * Fetch AI Vision Analysis for a specific screenshot.
 */
export async function fetchAnalysis(
  screenshotId: string,
  backendUrl?: string
): Promise<{ success: boolean; data?: ScreenshotAnalysisRecord; error?: string }> {
  try {
    const baseUrl = backendUrl || (await getBackendUrl());
    const endpoint = `${baseUrl}/api/analysis/${encodeURIComponent(screenshotId)}`;

    const response = await fetchWithTimeout(endpoint, { method: 'GET' }, 10000);
    if (response.ok) {
      const resData = await response.json();
      return { success: true, data: resData.data };
    }

    const errData = await response.json().catch(() => ({ error: 'HTTP error' }));
    return { success: false, error: errData.error || `Server responded with ${response.status}` };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Network error';
    return { success: false, error: msg };
  }
}

/**
 * Trigger AI Vision Analysis for a specific screenshot.
 */
export async function triggerAnalysis(
  screenshotId: string,
  backendUrl?: string
): Promise<{ success: boolean; data?: ScreenshotAnalysisRecord; error?: string }> {
  try {
    const baseUrl = backendUrl || (await getBackendUrl());
    const endpoint = `${baseUrl}/api/analysis/trigger/${encodeURIComponent(screenshotId)}`;

    const response = await fetchWithTimeout(endpoint, { method: 'POST' }, 15000);
    if (response.ok) {
      const resData = await response.json();
      return { success: true, data: resData.data };
    }

    const errData = await response.json().catch(() => ({ error: 'HTTP error' }));
    return { success: false, error: errData.error || `Server responded with ${response.status}` };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Network error';
    return { success: false, error: msg };
  }
}
