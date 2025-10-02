import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Upload, Download, Trash2, FileText, Globe, Smartphone, HelpCircle } from 'lucide-react';

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

// Mobile-recognized slug patterns for legal pages
const MOBILE_SLUG_PATTERNS = {
  terms: ['terms-of-use', 'termos-de-uso', 'terms', 'termos'],
  privacy: ['privacy-policy', 'politica-de-privacidade', 'privacy', 'privacidade'],
  cookies: ['cookies-policy', 'politica-de-cookies', 'cookies'],
};

const isMobileCompatibleSlug = (slug: string): boolean => {
  const normalizedSlug = slug.toLowerCase();
  return Object.values(MOBILE_SLUG_PATTERNS).some(patterns =>
    patterns.some(pattern => pattern.toLowerCase() === normalizedSlug)
  );
};

const getMobileSlugRecommendations = (): string[] => {
  return [
    'terms-of-use, termos-de-uso (Terms)',
    'privacy-policy, politica-de-privacidade (Privacy)',
    'cookies-policy, politica-de-cookies (Cookies)',
  ];
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

  const isMobileCompatible = (slug: string) => isMobileCompatibleSlug(slug);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Mobile Slug Help Banner */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-1">Mobile App Compatibility</h4>
                <p className="text-sm text-blue-800 mb-2">
                  Legal pages with the following slugs will be displayed in the mobile app:
                </p>
                <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
                  {getMobileSlugRecommendations().map((rec, idx) => (
                    <li key={idx}><code className="bg-blue-100 px-1 rounded">{rec}</code></li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {pages.map((page) => {
          // Defensive check for malformed data
          if (!page || !page._id || !page.title) {
            return null;
          }

          const mobileCompatible = isMobileCompatible(page.slug);

          return (
          <Card key={page._id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {page.title.en || page.title.pt || page.title.es || page.slug}
                  </CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{getTypeLabel(page.type)}</Badge>
                    <Badge variant={page.isActive ? 'default' : 'secondary'}>
                      {page.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {mobileCompatible && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                            <Smartphone className="h-3 w-3 mr-1" />
                            Mobile
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>This page will be displayed in the mobile app</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
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
                    <Button variant="destructive" size="sm" data-testid={`delete-page-${page._id}`}>
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
                      <AlertDialogAction onClick={() => onDelete(page._id)} data-testid="confirm-delete-page">
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
                              <Button variant="outline" size="sm" data-testid={`delete-file-${page._id}-${lang}`}>
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
                                <AlertDialogAction onClick={() => onDeleteFile(page._id, lang)} data-testid="confirm-delete-file">
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
          );
        })}
        {pages.length === 0 && (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              No legal pages created yet. Click "Add Legal Page" to create one.
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};