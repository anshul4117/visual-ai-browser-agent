/**
 * @visual-ai/shared-utils
 *
 * Shared utility functions for the Visual AI Browser Agent.
 * Used by both the Chrome extension and the backend server.
 */

import type { EventType } from '@visual-ai/shared-types';

/**
 * Generate a unique session ID.
 * Format: vai_<timestamp>_<random>
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `vai_${timestamp}_${random}`;
}

/**
 * Check if a string is a valid EventType.
 */
export function isValidEventType(value: string): value is EventType {
  const validTypes: readonly string[] = [
    'page_load',
    'url_change',
    'tab_switch',
    'click',
    'scroll',
    'form_interaction',
    'time_on_page',
  ];
  return validTypes.includes(value);
}

/**
 * Get the current timestamp as an ISO 8601 string.
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Truncate a string to a maximum length, appending '...' if truncated.
 */
export function truncate(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
