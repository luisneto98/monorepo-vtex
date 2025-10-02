import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import { LegalPagesList } from '@/components/legal-pages/LegalPagesList';
import { FileUploadZone } from '@/components/legal-pages/FileUploadZone';
import { apiService } from '@/services/api.service';

interface LegalPage {
  _id: string;
  slug: string;
  type: string;
  title: {
    pt?: string;
    en?: string;
    es?: string;
  };
  files?: {
    pt?: FileInfo;
    en?: FileInfo;
    es?: FileInfo;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FileInfo {
  filename: string;
  originalName: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
}

const LegalPages: React.FC = () => {
  const [pages, setPages] = useState<LegalPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPage, setSelectedPage] = useState<LegalPage | null>(null);
  const [uploadLanguage, setUploadLanguage] = useState<string>('pt');
  const { toast } = useToast();

  const [newPage, setNewPage] = useState({
    slug: '',
    type: 'terms',
    title: {
      pt: '',
      en: '',
      es: '',
    },
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const response = await apiService.get<LegalPage[]>('/legal-pages');
      if (response.success && response.data) {
        setPages(response.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch legal pages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await apiService.post<LegalPage>('/legal-pages', newPage);
      if (response.success && response.data) {
        setPages([...pages, response.data]);
      }
      setIsCreating(false);
      setNewPage({
        slug: '',
        type: 'terms',
        title: { pt: '', en: '', es: '' },
      });
      toast({
        title: 'Success',
        description: 'Legal page created successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create legal page',
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = async (pageId: string, file: File, language: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);

    try {
      // Use fetch directly for file upload
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${apiService.apiBaseUrl}/legal-pages/${pageId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      // Ensure the response has the correct structure
      if (data && data._id) {
        const updatedPages = pages.map((page) =>
          page._id === pageId ? data : page
        );
        setPages(updatedPages);
      } else {
        // If response format is unexpected, refetch all pages
        await fetchPages();
      }
      toast({
        title: 'Success',
        description: 'File uploaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload file',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteFile = async (pageId: string, language: string) => {
    try {
      const response = await apiService.delete<LegalPage>(`/legal-pages/${pageId}/file/${language}`);
      if (response.success && response.data) {
        const updatedPages = pages.map((page) =>
          page._id === pageId ? response.data! : page
        );
        setPages(updatedPages);
      }
      toast({
        title: 'Success',
        description: 'File deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete file',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePage = async (pageId: string) => {
    try {
      await apiService.delete(`/legal-pages/${pageId}`);
      setPages(pages.filter((page) => page._id !== pageId));
      toast({
        title: 'Success',
        description: 'Legal page deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete legal page',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (pageId: string, isActive: boolean) => {
    try {
      const response = await apiService.put<LegalPage>(`/legal-pages/${pageId}`, { isActive });
      if (response.success && response.data) {
        const updatedPages = pages.map((page) =>
          page._id === pageId ? response.data! : page
        );
        setPages(updatedPages);
      }
      toast({
        title: 'Success',
        description: `Page ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update page status',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Legal Pages Management</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Legal Page
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Legal Page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={newPage.slug}
                  onChange={(e) => setNewPage({ ...newPage, slug: e.target.value })}
                  placeholder="terms-of-use"
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={newPage.type}
                  onValueChange={(value: string) => setNewPage({ ...newPage, type: value as 'terms' | 'privacy' | 'cookies' | 'other' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="terms">Terms of Use</SelectItem>
                    <SelectItem value="privacy">Privacy Policy</SelectItem>
                    <SelectItem value="cookies">Cookie Policy</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Titles</Label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="title-pt">Portuguese</Label>
                  <Input
                    id="title-pt"
                    value={newPage.title.pt}
                    onChange={(e) =>
                      setNewPage({
                        ...newPage,
                        title: { ...newPage.title, pt: e.target.value },
                      })
                    }
                    placeholder="Termos de Uso"
                  />
                </div>
                <div>
                  <Label htmlFor="title-en">English</Label>
                  <Input
                    id="title-en"
                    value={newPage.title.en}
                    onChange={(e) =>
                      setNewPage({
                        ...newPage,
                        title: { ...newPage.title, en: e.target.value },
                      })
                    }
                    placeholder="Terms of Use"
                  />
                </div>
                <div>
                  <Label htmlFor="title-es">Spanish</Label>
                  <Input
                    id="title-es"
                    value={newPage.title.es}
                    onChange={(e) =>
                      setNewPage({
                        ...newPage,
                        title: { ...newPage.title, es: e.target.value },
                      })
                    }
                    placeholder="Términos de Uso"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate}>Create</Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <LegalPagesList
        pages={pages}
        onUpload={(page) => setSelectedPage(page)}
        onDelete={handleDeletePage}
        onToggleActive={handleToggleActive}
        onDeleteFile={handleDeleteFile}
      />

      {selectedPage && (
        <Card>
          <CardHeader>
            <CardTitle>Upload PDF for {selectedPage.title.en || selectedPage.slug}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select Language</Label>
              <Select value={uploadLanguage} onValueChange={setUploadLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">Portuguese</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <FileUploadZone
              onUpload={(file) => {
                handleFileUpload(selectedPage._id, file, uploadLanguage);
                setSelectedPage(null);
              }}
              accept="application/pdf"
              maxSize={10 * 1024 * 1024}
            />
            <Button variant="outline" onClick={() => setSelectedPage(null)}>
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LegalPages;