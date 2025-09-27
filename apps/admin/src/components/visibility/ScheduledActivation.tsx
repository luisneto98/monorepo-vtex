import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, X } from 'lucide-react';

interface ScheduledActivationProps {
  currentActivation?: {
    dateTime: Date | string;
    timezone: string;
  };
  onSchedule: (scheduledData: any) => void;
}

export default function ScheduledActivation({
  currentActivation,
  onSchedule,
}: ScheduledActivationProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [timezone, setTimezone] = useState(
    currentActivation?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  // Initialize date and time from current activation if exists
  React.useEffect(() => {
    if (currentActivation) {
      const dt = new Date(currentActivation.dateTime);
      setDate(dt.toISOString().split('T')[0]);
      setTime(dt.toTimeString().slice(0, 5));
    }
  }, [currentActivation]);

  const handleSchedule = () => {
    if (!date || !time) {
      return;
    }

    const dateTime = new Date(`${date}T${time}`);
    const now = new Date();

    if (dateTime <= now) {
      alert('Scheduled time must be in the future');
      return;
    }

    // Maximum 30 days in the future
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    if (dateTime > maxDate) {
      alert('Scheduled time cannot be more than 30 days in the future');
      return;
    }

    onSchedule({
      dateTime: dateTime.toISOString(),
      timezone,
    });
  };

  const handleClearSchedule = () => {
    setDate('');
    setTime('');
    onSchedule(null);
  };

  const commonTimezones = [
    'America/Sao_Paulo',
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
  ];

  return (
    <div className="space-y-4">
      {currentActivation && (
        <Alert>
          <Calendar className="h-4 w-4" />
          <AlertDescription>
            Currently scheduled for:{' '}
            {new Date(currentActivation.dateTime).toLocaleString()} (
            {currentActivation.timezone})
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="schedule-date">Date</Label>
          <Input
            id="schedule-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            max={
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0]
            }
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="schedule-time">Time</Label>
          <Input
            id="schedule-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="schedule-timezone">Timezone</Label>
        <Select value={timezone} onValueChange={setTimezone}>
          <SelectTrigger id="schedule-timezone" className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {commonTimezones.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleSchedule}
          disabled={!date || !time}
          variant="outline"
          size="sm"
        >
          <Clock className="h-4 w-4 mr-2" />
          Schedule Change
        </Button>
        {currentActivation && (
          <Button
            onClick={handleClearSchedule}
            variant="outline"
            size="sm"
          >
            <X className="h-4 w-4 mr-2" />
            Clear Schedule
          </Button>
        )}
      </div>

      <p className="text-xs text-gray-500">
        The visibility will automatically toggle at the scheduled time.
        Maximum scheduling is 30 days in the future.
      </p>
    </div>
  );
}