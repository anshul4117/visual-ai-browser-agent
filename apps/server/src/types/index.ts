import type { ActivityEvent } from '@visual-ai/shared-types';

/**
 * Filter options for querying events from the store.
 */
export interface EventQueryParams {
  sessionId?: string;
  eventType?: string;
  url?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

/**
 * Paginated query result for events.
 */
export interface PaginatedEventsResult {
  data: ActivityEvent[];
  total: number;
  limit: number;
  offset: number;
}
