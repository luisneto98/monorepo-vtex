import { apiService } from './api.service';
import type {
  SystemConfig,
  UpdateSystemConfigDto,
  UpdateSectionVisibilityDto,
  VisibilityAuditLog,
  PaginatedResponse,
  SectionName,
} from '@vtexday26/shared';

class SystemConfigService {
  async getConfig(): Promise<SystemConfig> {
    const response = await apiService.get<SystemConfig>('/system-config');
    return response.data as SystemConfig;
  }

  async getSectionVisibility(section: SectionName) {
    const response = await apiService.get(`/system-config/section/${section}`);
    return response.data;
  }

  async updateConfig(dto: UpdateSystemConfigDto): Promise<SystemConfig> {
    const response = await apiService.put<SystemConfig>('/system-config', dto);
    return response.data as SystemConfig;
  }

  async updateSection(
    section: SectionName,
    dto: UpdateSectionVisibilityDto
  ): Promise<SystemConfig> {
    const response = await apiService.patch<SystemConfig>(`/system-config/section/${section}`, dto);
    return response.data as SystemConfig;
  }

  async getAuditLogs(
    page: number = 1,
    limit: number = 20,
    section?: string
  ): Promise<PaginatedResponse<VisibilityAuditLog>> {
    const params: Record<string, string | number> = {
      page,
      limit,
    };
    if (section) {
      params.section = section;
    }
    const response = await apiService.get<PaginatedResponse<VisibilityAuditLog>>('/system-config/audit', params);
    return response.data as PaginatedResponse<VisibilityAuditLog>;
  }

  async getScheduledChanges() {
    const response = await apiService.get('/system-config/preview');
    return response.data;
  }

  async applyScheduledChanges() {
    const response = await apiService.post('/system-config/apply-scheduled');
    return response.data;
  }
}

export const systemConfigService = new SystemConfigService();