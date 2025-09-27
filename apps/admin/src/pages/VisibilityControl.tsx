import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Save, Eye } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { systemConfigService } from '@/services/system-config.service';
import VisibilityControls from '@/components/visibility/VisibilityControls';
import AuditLogViewer from '@/components/visibility/AuditLogViewer';
import PreviewPanel from '@/components/visibility/PreviewPanel';
import type { SystemConfig } from '@vtexday26/shared';

export default function VisibilityControl() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<any>({});
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await systemConfigService.getConfig();
      setConfig(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load visibility configuration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSectionUpdate = (section: string, updates: any) => {
    setPendingChanges((prev: any) => ({
      ...prev,
      [section]: updates,
    }));
  };

  const handleSave = async () => {
    if (Object.keys(pendingChanges).length === 0) {
      toast({
        title: 'No changes',
        description: 'No changes to save',
      });
      return;
    }

    try {
      setSaving(true);
      const updateDto = {
        sections: pendingChanges,
      };
      const updatedConfig = await systemConfigService.updateConfig(updateDto);
      setConfig(updatedConfig);
      setPendingChanges({});
      toast({
        title: 'Success',
        description: 'Visibility settings saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save visibility settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    setPendingChanges({});
    await loadConfig();
  };

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Visibility Control</h1>
          <p className="text-gray-600 mt-1">
            Control what content is visible on the website and mobile app
          </p>
        </div>
        <div className="flex gap-2">
          {hasPendingChanges && (
            <Badge variant="outline" className="mr-2">
              Unsaved changes
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={saving}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasPendingChanges || saving}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {hasPendingChanges && (
        <Alert className="mb-4">
          <AlertDescription>
            You have unsaved changes. Click "Save Changes" to apply them or "Refresh" to discard.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="sections" className="space-y-4">
            <TabsList>
              <TabsTrigger value="sections">Sections</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="audit">Audit Log</TabsTrigger>
            </TabsList>

            <TabsContent value="sections">
              {config && (
                <VisibilityControls
                  config={config}
                  pendingChanges={pendingChanges}
                  onSectionUpdate={handleSectionUpdate}
                />
              )}
            </TabsContent>

            <TabsContent value="schedule">
              <Card>
                <CardHeader>
                  <CardTitle>Scheduled Visibility Changes</CardTitle>
                  <CardDescription>
                    Upcoming scheduled changes to section visibility
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">
                    No scheduled changes at this time.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audit">
              <AuditLogViewer />
            </TabsContent>
          </Tabs>
        </div>

        {showPreview && (
          <div className="lg:col-span-1">
            <PreviewPanel
              config={config}
              pendingChanges={pendingChanges}
            />
          </div>
        )}
      </div>
    </div>
  );
}