import { useState } from 'react';
import type { Speaker, CreateSpeakerDto, UpdateSpeakerDto } from '@shared/types/speaker.types';
import { speakersService } from '@/services/speakers.service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SpeakerForm } from './SpeakerForm';

interface SpeakerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  speaker?: Speaker | null;
  onSuccess: () => void;
}

export function SpeakerDialog({ open, onOpenChange, speaker, onSuccess }: SpeakerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateSpeakerDto | UpdateSpeakerDto) => {
    try {
      setLoading(true);
      setError(null);

      if (speaker) {
        await speakersService.updateSpeaker(speaker._id!, data as UpdateSpeakerDto);
      } else {
        await speakersService.createSpeaker(data as CreateSpeakerDto);
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to save speaker');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{speaker ? 'Edit Speaker' : 'Add New Speaker'}</DialogTitle>
          <DialogDescription>
            {speaker ? 'Update the speaker information below.' : 'Fill in the information for the new speaker.'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
            {error}
          </div>
        )}

        <SpeakerForm
          speaker={speaker}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </DialogContent>
    </Dialog>
  );
}