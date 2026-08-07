import axios from 'axios';
import type {
  DashboardOverviewResponse,
  DashboardSessionsResponse,
  DashboardEventsResponse,
  DashboardScreenshotsResponse,
  DashboardAnalyticsResponse,
  HealthCheckResponse,
} from '@visual-ai/shared-types';

const API_BASE = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

export async function fetchHealth(): Promise<HealthCheckResponse> {
  const { data } = await apiClient.get<HealthCheckResponse>('/health');
  return data;
}

export async function fetchOverview(): Promise<DashboardOverviewResponse['data']> {
  const { data } = await apiClient.get<DashboardOverviewResponse>('/dashboard/overview');
  return data.data;
}

export async function fetchSessions(): Promise<DashboardSessionsResponse['data']> {
  const { data } = await apiClient.get<DashboardSessionsResponse>('/dashboard/sessions');
  return data.data;
}

export async function fetchEvents(params: {
  sessionId?: string;
  eventType?: string;
  url?: string;
  page?: number;
  limit?: number;
}): Promise<DashboardEventsResponse> {
  const { data } = await apiClient.get<DashboardEventsResponse>('/dashboard/events', { params });
  return data;
}

export async function fetchScreenshots(params: {
  sessionId?: string;
  page?: number;
  limit?: number;
}): Promise<DashboardScreenshotsResponse> {
  const { data } = await apiClient.get<DashboardScreenshotsResponse>('/dashboard/screenshots', { params });
  return data;
}

export async function fetchAnalytics(): Promise<DashboardAnalyticsResponse['data']> {
  const { data } = await apiClient.get<DashboardAnalyticsResponse>('/dashboard/analytics');
  return data.data;
}

export async function triggerAnalysis(screenshotId: string): Promise<void> {
  await apiClient.post(`/analysis/trigger/${screenshotId}`);
}
