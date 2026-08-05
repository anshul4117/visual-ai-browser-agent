/**
 * Content Script
 *
 * Injected into all pages at document_idle.
 * Captures DOM-level user interactions and sends them to the background worker.
 *
 * Tracked events:
 * - PAGE_LOADED (on injection)
 * - CLICK (on user click)
 * - SCROLL (throttled)
 * - VISIBILITY_CHANGED (tab hidden/shown)
 *
 * IMPORTANT (from AGENT.md):
 * - Must not block the main thread
 * - Use passive event listeners where appropriate
 * - Throttle scroll events
 * - Avoid duplicate PAGE_LOADED events
 */

import type {
  PageLoadedMessage,
  ClickMessage,
  ScrollMessage,
  VisibilityChangedMessage,
} from '../messaging/types.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Safely send a message to the background service worker.
 * Silently handles context invalidation (expected on extension reload).
 */
function sendToBackground(
  message: PageLoadedMessage | ClickMessage | ScrollMessage | VisibilityChangedMessage
): void {
  try {
    chrome.runtime.sendMessage(message, () => {
      if (chrome.runtime.lastError) {
        // Extension context invalidated — expected on reload, not an error
        console.debug('[Visual AI]', chrome.runtime.lastError.message);
      }
    });
  } catch {
    // Extension context fully destroyed
  }
}

/**
 * Build a simple CSS selector for an element.
 * Returns tag#id or tag.class or just tag.
 */
function getSelector(el: Element): string {
  if (el.id) return `${el.tagName.toLowerCase()}#${el.id}`;
  if (el.className && typeof el.className === 'string') {
    const cls = el.className.trim().split(/\s+/).slice(0, 2).join('.');
    return `${el.tagName.toLowerCase()}.${cls}`;
  }
  return el.tagName.toLowerCase();
}

/**
 * Truncate text for storage (no sensitive data, max 100 chars).
 */
function truncate(text: string, max: number = 100): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  return cleaned.substring(0, max - 3) + '...';
}

/**
 * Get current scroll depth as a percentage (0–100).
 */
function getScrollPercentage(): number {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (docHeight <= 0) return 100;
  return Math.round((scrollTop / docHeight) * 100);
}

/**
 * Create a throttle function that fires at most once every `delayMs`.
 */
function throttle<T extends (...args: unknown[]) => void>(fn: T, delayMs: number): T {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return ((...args: unknown[]) => {
    const now = Date.now();
    const remaining = delayMs - (now - lastCall);

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      fn(...args);
    } else if (!timeoutId) {
      // Schedule trailing call
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        fn(...args);
      }, remaining);
    }
  }) as T;
}

// ─── PAGE_LOADED ─────────────────────────────────────────────────────────────

/** Guard against duplicate PAGE_LOADED for the same URL in this script instance. */
let pageLoadedSent = false;

function notifyPageLoaded(): void {
  if (pageLoadedSent) return;
  pageLoadedSent = true;

  const message: PageLoadedMessage = {
    type: 'PAGE_LOADED',
    data: {
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString(),
    },
  };
  sendToBackground(message);
}

// ─── CLICK Tracking ──────────────────────────────────────────────────────────

function handleClick(e: MouseEvent): void {
  const target = e.target;
  if (!(target instanceof Element)) return;

  const message: ClickMessage = {
    type: 'CLICK',
    data: {
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString(),
      selector: getSelector(target),
      tagName: target.tagName,
      innerText: truncate((target as HTMLElement).innerText || ''),
    },
  };
  sendToBackground(message);
}

// ─── SCROLL Tracking ─────────────────────────────────────────────────────────

/** Tracks last scroll percentage to avoid logging identical values. */
let lastScrollPct = -1;

const handleScroll = throttle((): void => {
  const pct = getScrollPercentage();

  // Skip if scroll position hasn't meaningfully changed (>= 5% difference)
  if (Math.abs(pct - lastScrollPct) < 5) return;
  lastScrollPct = pct;

  const message: ScrollMessage = {
    type: 'SCROLL',
    data: {
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString(),
      scrollPercentage: pct,
    },
  };
  sendToBackground(message);
}, 2000); // Throttle: at most once every 2 seconds

// ─── VISIBILITY_CHANGED Tracking ─────────────────────────────────────────────

function handleVisibilityChange(): void {
  const message: VisibilityChangedMessage = {
    type: 'VISIBILITY_CHANGED',
    data: {
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString(),
      visibilityState: document.visibilityState,
    },
  };
  sendToBackground(message);
}

// ─── Initialize ──────────────────────────────────────────────────────────────

// Send PAGE_LOADED on injection (document_idle)
notifyPageLoaded();

// Click — capture phase to get all clicks including those stopped by handlers
document.addEventListener('click', handleClick, { capture: true, passive: true });

// Scroll — passive listener, throttled
window.addEventListener('scroll', handleScroll, { passive: true });

// Visibility — fires when tab is hidden/shown
document.addEventListener('visibilitychange', handleVisibilityChange);
