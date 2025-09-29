import { apiService } from './api.service';
import DOMPurify from 'dompurify';
import type {
  PressMaterial,
  CreatePressMaterialDto,
  UpdatePressMaterialDto,
  PressMaterialPaginationDto,
} from '@shared/types/press-materials';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class PressMaterialsService {
  private readonly baseEndpoint = '/press-materials';

  async getAll(params?: PressMaterialPaginationDto): Promise<PaginatedResponse<PressMaterial>> {
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      if (params.filters) {
        if (params.filters.type) queryParams.append('type', params.filters.type);
        if (params.filters.status) queryParams.append('status', params.filters.status);
        if (params.filters.accessLevel)
          queryParams.append('accessLevel', params.filters.accessLevel);
        if (params.filters.search) queryParams.append('search', params.filters.search);
        if (params.filters.tags?.length) {
          params.filters.tags.forEach((tag) => queryParams.append('tags', tag));
        }
      }
    }

    const query = queryParams.toString();
    const url = query ? `${this.baseEndpoint}?${query}` : this.baseEndpoint;

    const response = await apiService.get<PaginatedResponse<PressMaterial>>(url);

    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error?.message || 'Failed to fetch press materials');
    }
  }

  async getById(id: string): Promise<PressMaterial> {
    const response = await apiService.get<PressMaterial>(`${this.baseEndpoint}/${id}`);

    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error?.message || 'Failed to fetch press material');
    }
  }

  async create(data: CreatePressMaterialDto): Promise<PressMaterial> {
    const response = await apiService.post<PressMaterial>(this.baseEndpoint, data);

    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error?.message || 'Failed to create press material');
    }
  }

  async update(id: string, data: UpdatePressMaterialDto): Promise<PressMaterial> {
    const response = await apiService.patch<PressMaterial>(`${this.baseEndpoint}/${id}`, data);

    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error?.message || 'Failed to update press material');
    }
  }

  async delete(id: string): Promise<void> {
    const response = await apiService.delete(`${this.baseEndpoint}/${id}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete press material');
    }
  }

  async deleteMany(ids: string[]): Promise<void> {
    const response = await apiService.post(`${this.baseEndpoint}/bulk-delete`, { ids });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete press materials');
    }
  }

  async uploadFile(file: File, materialData?: CreatePressMaterialDto): Promise<PressMaterial> {
    const formData = new FormData();
    formData.append('file', file);

    if (materialData) {
      formData.append('type', materialData.type);
      formData.append('title', JSON.stringify(materialData.title));
      if (materialData.description) {
        formData.append('description', JSON.stringify(materialData.description));
      }
      if (materialData.tags) {
        formData.append('tags', JSON.stringify(materialData.tags));
      }
      if (materialData.status) {
        formData.append('status', materialData.status);
      }
      if (materialData.accessLevel) {
        formData.append('accessLevel', materialData.accessLevel);
      }
    }

    const response = await apiService.post<PressMaterial>(`${this.baseEndpoint}/upload`, formData);

    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error?.message || 'Failed to upload file');
    }
  }

  async uploadMultiple(
    files: File[],
    materialDataArray?: CreatePressMaterialDto[],
  ): Promise<PressMaterial[]> {
    const promises = files.map((file, index) => {
      const materialData = materialDataArray?.[index];
      return this.uploadFile(file, materialData);
    });

    return Promise.all(promises);
  }

  async updateStatus(ids: string[], status: 'draft' | 'published' | 'archived'): Promise<void> {
    const response = await apiService.post(`${this.baseEndpoint}/bulk-status`, {
      ids,
      status,
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to update status');
    }
  }

  async updateAccess(ids: string[], accessLevel: 'public' | 'restricted'): Promise<void> {
    const response = await apiService.post(`${this.baseEndpoint}/bulk-access`, {
      ids,
      accessLevel,
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to update access level');
    }
  }

  async addTags(ids: string[], tags: string[]): Promise<void> {
    const response = await apiService.post(`${this.baseEndpoint}/bulk-tags`, {
      ids,
      tags,
      action: 'add',
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to add tags');
    }
  }

  async removeTags(ids: string[], tags: string[]): Promise<void> {
    const response = await apiService.post(`${this.baseEndpoint}/bulk-tags`, {
      ids,
      tags,
      action: 'remove',
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to remove tags');
    }
  }

  async download(id: string): Promise<Blob> {
    // Use fetch directly for blob responses since apiService doesn't support responseType
    const response = await fetch(`${apiService.apiBaseUrl}${this.baseEndpoint}/${id}/download`, {
      method: 'GET',
      headers: apiService.getHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return response.blob();
  }

  async downloadMultiple(ids: string[]): Promise<Blob> {
    // Use fetch directly for blob responses since apiService doesn't support responseType
    const response = await fetch(`${apiService.apiBaseUrl}${this.baseEndpoint}/bulk-download`, {
      method: 'POST',
      headers: apiService.getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      throw new Error(`Bulk download failed: ${response.statusText}`);
    }

    return response.blob();
  }

  async getPublicUrl(id: string): Promise<string> {
    const material = await this.getById(id);
    return material.fileUrl || '';
  }

  async getTags(): Promise<string[]> {
    const response = await apiService.get<string[]>(`${this.baseEndpoint}/tags`);

    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error?.message || 'Failed to fetch tags');
    }
  }

  async getStatistics(): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    totalDownloads: number;
    recentUploads: number;
  }> {
    const response = await apiService.get<{
      total: number;
      byType: Record<string, number>;
      byStatus: Record<string, number>;
      totalDownloads: number;
      recentUploads: number;
    }>(`${this.baseEndpoint}/statistics`);

    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error?.message || 'Failed to fetch statistics');
    }
  }

  // Helper method to create download link with filename sanitization
  async createDownloadLink(material: PressMaterial, filename?: string): Promise<void> {
    try {
      const blob = await this.download(material._id!);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Sanitize filename to prevent DOM injection
      const sanitizedFilename = DOMPurify.sanitize(filename || material.title.pt || 'download', {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      });
      a.download = sanitizedFilename;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }

  // Helper method to handle file upload with progress using XMLHttpRequest
  async uploadWithProgress(
    file: File,
    materialData: CreatePressMaterialDto,
    onProgress?: (progress: number) => void,
  ): Promise<PressMaterial> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();

      formData.append('file', file);
      formData.append('type', materialData.type);
      formData.append('title', JSON.stringify(materialData.title));

      if (materialData.description) {
        formData.append('description', JSON.stringify(materialData.description));
      }
      if (materialData.tags) {
        formData.append('tags', JSON.stringify(materialData.tags));
      }
      if (materialData.status) {
        formData.append('status', materialData.status);
      }
      if (materialData.accessLevel) {
        formData.append('accessLevel', materialData.accessLevel);
      }

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(Math.round(percentComplete));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            // Handle the ApiResponse wrapper format
            if (response.success && response.data) {
              resolve(response.data);
            } else if (response.statusCode === 200 && response.data) {
              resolve(response.data);
            } else {
              resolve(response);
            }
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error(`Upload failed with status: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', `${apiService.apiBaseUrl}${this.baseEndpoint}/upload`);

      // Set headers from apiService but exclude Content-Type for FormData
      const headers = apiService.getHeaders();
      Object.entries(headers).forEach(([key, value]) => {
        if (key !== 'Content-Type') {
          xhr.setRequestHeader(key, value);
        }
      });

      // Set credentials for CSRF protection
      xhr.withCredentials = true;

      xhr.send(formData);
    });
  }
}

export const pressMaterialsService = new PressMaterialsService();
