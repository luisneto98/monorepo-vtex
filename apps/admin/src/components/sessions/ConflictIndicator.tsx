import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { ISession } from '@shared/types/session.types';
import { format } from 'date-fns';

interface ConflictIndicatorProps {
  conflicts: ISession[];
  isChecking: boolean;
}

export function ConflictIndicator({ conflicts, isChecking }: ConflictIndicatorProps) {
  if (isChecking) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4 animate-pulse" />
        <AlertTitle>Checking for conflicts...</AlertTitle>
        <AlertDescription>
          Validating schedule against existing sessions
        </AlertDescription>
      </Alert>
    );
  }

  if (!conflicts || conflicts.length === 0) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">No Conflicts</AlertTitle>
        <AlertDescription className="text-green-700">
          This schedule slot is available
        </AlertDescription>
      </Alert>
    );
  }

  const hasStageConflict = conflicts.some(c => c.stage);
  const hasSpeakerConflict = conflicts.some(c => c.speakerIds && c.speakerIds.length > 0);

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800">
        Schedule Conflicts Detected
      </AlertTitle>
      <AlertDescription className="text-amber-700">
        <div className="mt-2 space-y-2">
          {hasStageConflict && (
            <div className="text-sm">
              <Badge variant="outline" className="mr-2 bg-amber-100">
                Stage Conflict
              </Badge>
              The selected stage is already booked for this time
            </div>
          )}

          {hasSpeakerConflict && (
            <div className="text-sm">
              <Badge variant="outline" className="mr-2 bg-amber-100">
                Speaker Conflict
              </Badge>
              One or more speakers have another session at this time
            </div>
          )}

          <div className="mt-3">
            <p className="text-sm font-medium mb-1">Conflicting sessions:</p>
            <ul className="space-y-1">
              {conflicts.map((conflict) => (
                <li key={conflict._id.toString()} className="text-sm pl-4">
                  • <span className="font-medium">{conflict.title.en}</span>
                  {' at '}
                  <span className="font-medium">{conflict.stage}</span>
                  {' ('}
                  {format(new Date(conflict.startTime), 'HH:mm')}
                  {' - '}
                  {format(new Date(conflict.endTime), 'HH:mm')}
                  {')'}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-3 pt-3 border-t border-amber-200">
            <p className="text-xs text-amber-600">
              ⚠️ You can still save this session, but please review the conflicts.
              Consider changing the time, stage, or speakers to avoid overlaps.
            </p>
            <p className="text-xs text-amber-700 mt-1 font-medium">
              Saving with conflicts may impact attendee experience and speaker availability.
            </p>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}

interface ConflictBadgeProps {
  hasConflict: boolean;
  conflictCount?: number;
}

export function ConflictBadge({ hasConflict, conflictCount = 0 }: ConflictBadgeProps) {
  if (!hasConflict) {
    return null;
  }

  return (
    <Badge variant="destructive" className="ml-2">
      <AlertTriangle className="mr-1 h-3 w-3" />
      {conflictCount} conflict{conflictCount !== 1 ? 's' : ''}
    </Badge>
  );
}

interface ScheduleValidationSummaryProps {
  startTime: Date;
  endTime: Date;
  stage: string;
  speakerCount: number;
  conflicts: ISession[];
}

export function ScheduleValidationSummary({
  startTime,
  endTime,
  stage,
  speakerCount,
  conflicts,
}: ScheduleValidationSummaryProps) {
  const duration = (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60);
  const hasValidSchedule = duration > 0 && duration <= 480; // Max 8 hours

  return (
    <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
      <h4 className="text-sm font-medium">Schedule Validation Summary</h4>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Duration:</span>
          <span className={duration > 0 ? '' : 'text-destructive'}>
            {duration > 0 ? `${Math.floor(duration / 60)}h ${duration % 60}min` : 'Invalid'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Stage:</span>
          <span>{stage || 'Not selected'}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Speakers:</span>
          <span>{speakerCount}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Conflicts:</span>
          <span className={conflicts.length > 0 ? 'text-amber-600' : 'text-green-600'}>
            {conflicts.length}
          </span>
        </div>
      </div>

      {!hasValidSchedule && (
        <Alert className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Please ensure the end time is after the start time and the duration is reasonable.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}