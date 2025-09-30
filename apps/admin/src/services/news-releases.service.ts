import { apiService } from './api.service';
import {
  type NewsRelease,
  type CreateNewsReleaseDto,
  type UpdateNewsReleaseDto,
  type NewsReleaseFilter,
} from '@shared/types/news-releases';

export interface NewsReleasesResponse {
  items: NewsRelease[];
  total: number;
  page: number;
  pages: number;
}

class NewsReleasesService {
  async getNewsReleases(filters?: NewsReleaseFilter): Promise<NewsReleasesResponse> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          filters.status.forEach((s) => params.append('status', s));
        } else {
          params.append('status', filters.status);
        }
      }
      if (filters.featured !== undefined) params.append('featured', String(filters.featured));
      if (filters.categories) filters.categories.forEach((c) => params.append('categories', c));
      if (filters.tags) filters.tags.forEach((t) => params.append('tags', t));
      if (filters.author) params.append('author', filters.author);
      if (filters.search) params.append('search', filters.search);
      if (filters.language) params.append('language', filters.language);
      if (filters.publishedAfter)
        params.append('publishedAfter', filters.publishedAfter.toISOString());
      if (filters.publishedBefore)
        params.append('publishedBefore', filters.publishedBefore.toISOString());
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    }

    const response = await apiService.get<NewsReleasesResponse>(
      `/news-releases?${params.toString()}`,
    );
    return response.data!;
  }

  async getNewsRelease(id: string): Promise<NewsRelease> {
    const response = await apiService.get<NewsRelease>(`/news-releases/${id}`);
    return response.data!;
  }

  async createNewsRelease(dto: CreateNewsReleaseDto): Promise<NewsRelease> {
    const response = await apiService.post<NewsRelease>('/news-releases', dto);
    return response.data!;
  }

  async updateNewsRelease(id: string, dto: UpdateNewsReleaseDto): Promise<NewsRelease> {
    const response = await apiService.patch<NewsRelease>(`/news-releases/${id}`, dto);
    return response.data!;
  }

  async deleteNewsRelease(id: string): Promise<void> {
    await apiService.delete(`/news-releases/${id}`);
  }

  async restoreNewsRelease(id: string): Promise<NewsRelease> {
    const response = await apiService.post<NewsRelease>(`/news-releases/${id}/restore`);
    return response.data!;
  }

  async publishNewsRelease(id: string): Promise<NewsRelease> {
    const response = await apiService.post<NewsRelease>(`/news-releases/${id}/publish`);
    return response.data!;
  }

  async archiveNewsRelease(id: string): Promise<NewsRelease> {
    const response = await apiService.post<NewsRelease>(`/news-releases/${id}/archive`);
    return response.data!;
  }

  async uploadImage(
    id: string,
    file: File,
    metadata?: {
      caption?: Record<string, string>;
      altText?: Record<string, string>;
      order?: number;
    },
  ): Promise<NewsRelease> {
    const formData = new FormData();
    formData.append('image', file);

    if (metadata) {
      if (metadata.caption) formData.append('caption', JSON.stringify(metadata.caption));
      if (metadata.altText) formData.append('altText', JSON.stringify(metadata.altText));
      if (metadata.order !== undefined) formData.append('order', String(metadata.order));
    }

    const response = await apiService.post<NewsRelease>(`/news-releases/${id}/images`, formData);
    return response.data!;
  }

  async removeImage(id: string, imageId: string): Promise<NewsRelease> {
    const response = await apiService.delete<NewsRelease>(`/news-releases/${id}/images/${imageId}`);
    return response.data!;
  }

  async reorderImages(id: string, imageIds: string[]): Promise<NewsRelease> {
    const response = await apiService.patch<NewsRelease>(`/news-releases/${id}/images/reorder`, {
      imageIds,
    });
    return response.data!;
  }

  async bulkPublish(ids: string[]): Promise<void> {
    await Promise.all(ids.map((id) => this.publishNewsRelease(id)));
  }

  async bulkArchive(ids: string[]): Promise<void> {
    await Promise.all(ids.map((id) => this.archiveNewsRelease(id)));
  }

  async bulkDelete(ids: string[]): Promise<void> {
    await Promise.all(ids.map((id) => this.deleteNewsRelease(id)));
  }
}

export default new NewsReleasesService();
