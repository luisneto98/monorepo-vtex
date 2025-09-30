import { apiService } from './api.service';

export interface CreateNotificationDto {
  title: string;
  message: string;
  scheduledAt?: Date;
  segments?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateNotificationDto {
  title?: string;
  message?: string;
  scheduledAt?: Date;
  segments?: string[];
  metadata?: Record<string, unknown>;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  scheduledAt?: Date;
  sentAt?: Date;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  deviceCount: number;
  deliveredCount?: number;
  failedCount?: number;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  segments?: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeviceToken {
  _id: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  appVersion?: string;
  lastActive: Date;
  isTestDevice: boolean;
}

export interface NotificationStats {
  totalSent: number;
  totalFailed: number;
  totalScheduled: number;
  totalDevices: number;
  deliveryRate: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

class NotificationsService {
  private readonly basePath = '/notifications';

  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    const response = await apiService.post<Notification>(this.basePath, dto);
    return response.data!;
  }

  async scheduleNotification(dto: CreateNotificationDto): Promise<Notification> {
    const response = await apiService.post<Notification>(`${this.basePath}/schedule`, dto);
    return response.data!;
  }

  async getNotifications(
    page = 1,
    limit = 10,
    status?: string,
  ): Promise<PaginatedResponse<Notification>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) {
      params.append('status', status);
    }

    const response = await apiService.get<PaginatedResponse<Notification>>(
      `${this.basePath}?${params.toString()}`,
    );
    return response.data!;
  }

  async getNotification(id: string): Promise<Notification> {
    const response = await apiService.get<Notification>(`${this.basePath}/${id}`);
    return response.data!;
  }

  async updateNotification(id: string, dto: UpdateNotificationDto): Promise<Notification> {
    const response = await apiService.put<Notification>(`${this.basePath}/${id}`, dto);
    return response.data!;
  }

  async deleteNotification(id: string): Promise<void> {
    await apiService.delete(`${this.basePath}/${id}`);
  }

  async cancelScheduledNotification(id: string): Promise<void> {
    await apiService.post(`${this.basePath}/${id}/cancel`, {});
  }

  async getHistory(
    page = 1,
    limit = 10,
    startDate?: Date,
    endDate?: Date,
    search?: string,
  ): Promise<PaginatedResponse<Notification>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (startDate) {
      params.append('startDate', startDate.toISOString());
    }

    if (endDate) {
      params.append('endDate', endDate.toISOString());
    }

    if (search) {
      params.append('search', search);
    }

    const response = await apiService.get<PaginatedResponse<Notification>>(
      `${this.basePath}/history?${params.toString()}`,
    );
    return response.data!;
  }

  async getStats(): Promise<NotificationStats> {
    const response = await apiService.get<NotificationStats>(`${this.basePath}/stats`);
    return response.data!;
  }

  async getScheduledNotifications(page = 1, limit = 10): Promise<PaginatedResponse<Notification>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await apiService.get<PaginatedResponse<Notification>>(
      `${this.basePath}/scheduled?${params.toString()}`,
    );
    return response.data!;
  }

  async getTestDevices(): Promise<DeviceToken[]> {
    const response = await apiService.get<DeviceToken[]>(`${this.basePath}/devices/test`);
    return response.data!;
  }

  async sendTestNotification(title: string, message: string, deviceTokenId: string): Promise<void> {
    await apiService.post(`${this.basePath}/test`, {
      title,
      message,
      deviceTokenId,
    });
  }
}

export default new NotificationsService();