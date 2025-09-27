import { useState } from 'react';
import { SessionsList } from '@/components/sessions/SessionsList';
import { SessionDialog } from '@/components/sessions/SessionDialog';
import { SessionPreview } from '@/components/sessions/SessionPreview';
import type { ISession } from '@shared/types/session.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Sessions() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ISession | null>(null);

  const handleAdd = () => {
    setSelectedSession(null);
    setDialogOpen(true);
  };

  const handleEdit = (session: ISession) => {
    setSelectedSession(session);
    setDialogOpen(true);
  };

  const handlePreview = (session: ISession) => {
    setSelectedSession(session);
    setPreviewOpen(true);
  };

  const handleSave = () => {
    setDialogOpen(false);
    setSelectedSession(null);
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Session Management</CardTitle>
          <CardDescription>
            Manage your event sessions, schedule, speakers and sponsors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SessionsList
            onAdd={handleAdd}
            onEdit={handleEdit}
            onPreview={handlePreview}
          />
        </CardContent>
      </Card>

      <SessionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        session={selectedSession}
        onSave={handleSave}
      />

      {selectedSession && (
        <SessionPreview
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          session={selectedSession}
        />
      )}
    </div>
  );
}