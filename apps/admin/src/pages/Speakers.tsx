import { useState } from 'react';
import type { Speaker } from '@shared/types/speaker.types';
import { SpeakersList } from '@/components/speakers/SpeakersList';
import { SpeakerDialog } from '@/components/speakers/SpeakerDialog';
import { speakersService } from '@/services/speakers.service';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function Speakers() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [speakerToDelete, setSpeakerToDelete] = useState<Speaker | null>(null);

  const handleAdd = () => {
    setSelectedSpeaker(null);
    setShowDialog(true);
  };

  const handleEdit = (speaker: Speaker) => {
    setSelectedSpeaker(speaker);
    setShowDialog(true);
  };

  const handleDelete = (speaker: Speaker) => {
    setSpeakerToDelete(speaker);
    setShowDeleteDialog(true);
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleConfirmDelete = async () => {
    if (!speakerToDelete) return;

    try {
      await speakersService.deleteSpeaker(speakerToDelete._id!);
      handleRefresh();
      setShowDeleteDialog(false);
      setSpeakerToDelete(null);
    } catch (error) {
      console.error('Failed to delete speaker:', error);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Speakers Management</h1>
        <p className="text-muted-foreground">Manage speakers for VTEX Day 2026</p>
      </div>

      <SpeakersList
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        refreshTrigger={refreshTrigger}
      />

      <SpeakerDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        speaker={selectedSpeaker}
        onSuccess={handleRefresh}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Speaker</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {speakerToDelete?.name}? This action will mark the speaker as deleted and they will no longer appear in the list.
              {speakerToDelete && ' This speaker can be restored later if needed.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}