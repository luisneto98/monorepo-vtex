import { apiService } from './api.service';
import type { EventSettings, UpdateEventSettingsDto } from '@vtexday26/shared';

export class EventSettingsService {
  private readonly baseURL = '/event-settings';

  async getSettings(): Promise<EventSettings> {
    const response = await apiService.get<EventSettings>(this.baseURL);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch event settings');
    }
    return response.data;
  }

  async updateSettings(data: UpdateEventSettingsDto): Promise<EventSettings> {
    const response = await apiService.put<EventSettings>(this.baseURL, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update event settings');
    }
    return response.data;
  }
}

export const eventSettingsService = new EventSettingsService();