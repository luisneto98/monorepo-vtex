import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Upload, Download, Trash2, FileText, Globe } from 'lucide-react';

interface FileInfo {
  filename: string;
  originalName: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
}

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

interface LegalPagesListProps {
  pages: LegalPage[];
  onUpload: (page: LegalPage) => void;
  onDelete: (pageId: string) => void;
  onToggleActive: (pageId: string, isActive: boolean) => void;
  onDeleteFile: (pageId: string, language: string) => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const getTypeLabel = (type: string) => {
  const labels: { [key: string]: string } = {
    terms: 'Terms of Use',
    privacy: 'Privacy Policy',
    cookies: 'Cookie Policy',
    other: 'Other',
  };
  return labels[type] || type;
};

export const LegalPagesList: React.FC<LegalPagesListProps> = ({
  pages,
  onUpload,
  onDelete,
  onToggleActive,
  onDeleteFile,
}) => {
  const languages = ['pt', 'en', 'es'] as const;
  const languageLabels = {
    pt: 'Portuguese',
    en: 'English',
    es: 'Spanish',
  };

  return (
    <div className="space-y-4">
      {pages.map((page) => (
        <Card key={page._id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {page.title.en || page.slug}
                </CardTitle>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{getTypeLabel(page.type)}</Badge>
                  <Badge variant={page.isActive ? 'default' : 'secondary'}>
                    {page.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <code className="text-sm text-muted-foreground">{page.slug}</code>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={page.isActive}
                  onCheckedChange={(checked) => onToggleActive(page._id, checked)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpload(page)}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Legal Page</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this legal page? This will remove all associated PDF files.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(page._id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold mb-2">Uploaded Files:</h4>
              <div className="grid grid-cols-3 gap-4">
                {languages.map((lang) => (
                  <div key={lang} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        <span className="text-sm font-medium">{languageLabels[lang]}</span>
                      </div>
                    </div>
                    {page.files?.[lang] ? (
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">
                          <p className="truncate" title={page.files[lang].originalName}>
                            {page.files[lang].originalName}
                          </p>
                          <p>{formatFileSize(page.files[lang].size)}</p>
                          <p>Uploaded: {new Date(page.files[lang].uploadedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              window.open(`${import.meta.env.VITE_API_URL}/legal-pages/public/${page.slug}/${lang}/download`, '_blank');
                            }}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete File</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the {languageLabels[lang]} PDF file?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDeleteFile(page._id, lang)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        No file uploaded
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {pages.length === 0 && (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            No legal pages created yet. Click "Add Legal Page" to create one.
          </CardContent>
        </Card>
      )}
    </div>
  );
};