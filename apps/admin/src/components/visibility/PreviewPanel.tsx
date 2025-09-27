import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Monitor, Smartphone, Tablet } from 'lucide-react';
import type { SystemConfig } from '@vtexday26/shared';

interface PreviewPanelProps {
  config: SystemConfig | null;
  pendingChanges: any;
}

export default function PreviewPanel({
  config,
  pendingChanges,
}: PreviewPanelProps) {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>(
    'desktop'
  );
  const [refreshKey, setRefreshKey] = useState(0);

  if (!config) {
    return null;
  }

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const getPreviewUrl = () => {
    const baseUrl = import.meta.env.VITE_WEB_URL || 'http://localhost:3000';
    const sections = config.sections || {};
    const previewConfig = Object.entries(pendingChanges).reduce((acc, [section, changes]) => ({
      ...acc,
      [section]: {
        ...(sections[section as keyof typeof sections] || {}),
        ...(changes || {}),
      },
    }), JSON.parse(JSON.stringify(sections)));

    // Encode the preview config as a URL parameter
    const encodedConfig = encodeURIComponent(JSON.stringify(previewConfig));
    return `${baseUrl}?preview=true&config=${encodedConfig}`;
  };

  const getViewportDimensions = () => {
    switch (viewport) {
      case 'mobile':
        return { width: 375, height: 667 };
      case 'tablet':
        return { width: 768, height: 1024 };
      default:
        return { width: '100%', height: 600 };
    }
  };

  const dimensions = getViewportDimensions();

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              Live preview of visibility changes
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select
              value={viewport}
              onValueChange={(v: any) => setViewport(v)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desktop">
                  <div className="flex items-center">
                    <Monitor className="h-4 w-4 mr-2" />
                    Desktop
                  </div>
                </SelectItem>
                <SelectItem value="tablet">
                  <div className="flex items-center">
                    <Tablet className="h-4 w-4 mr-2" />
                    Tablet
                  </div>
                </SelectItem>
                <SelectItem value="mobile">
                  <div className="flex items-center">
                    <Smartphone className="h-4 w-4 mr-2" />
                    Mobile
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {Object.keys(pendingChanges).length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              Preview includes unsaved changes
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Current Visibility Status</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(config.sections).map(([section, visibility]) => {
                const pending = pendingChanges[section];
                const isVisible = pending?.isVisible ?? visibility.isVisible;

                return (
                  <div
                    key={section}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <span className="text-sm capitalize">{section}</span>
                    <Badge
                      variant={isVisible ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {isVisible ? 'Visible' : 'Hidden'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border rounded overflow-hidden">
            <div className="bg-gray-100 p-2 text-center text-xs text-gray-600">
              Website Preview ({viewport})
            </div>
            <iframe
              key={refreshKey}
              src={getPreviewUrl()}
              width={dimensions.width}
              height={dimensions.height}
              className="mx-auto border-0"
              style={{
                maxWidth: '100%',
                display: 'block',
              }}
              title="Website Preview"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}