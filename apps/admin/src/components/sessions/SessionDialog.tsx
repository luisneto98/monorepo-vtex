import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SessionForm } from './SessionForm';
import { SessionsService } from '@/services/sessions.service';
import type { ISession } from '@shared/types/session.types';

interface SessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session?: ISession | null;
  onSave: () => void;
}

export function SessionDialog({
  open,
  onOpenChange,
  session,
  onSave,
}: SessionDialogProps) {
  const handleSubmit = async (values: Omit<ISession, '_id' | 'createdAt' | 'updatedAt'>) => {
    if (session) {
      await SessionsService.updateSession(session._id.toString(), values);
    } else {
      await SessionsService.createSession(values);
    }
    onSave();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {session ? 'Edit Session' : 'Add New Session'}
          </DialogTitle>
          <DialogDescription>
            {session
              ? 'Update the session details below'
              : 'Fill in the information to create a new session'}
          </DialogDescription>
        </DialogHeader>
        <SessionForm
          session={session}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}