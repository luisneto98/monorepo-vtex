import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import NotificationPreview from './NotificationPreview';
import notificationsService from '@/services/notifications.service';

const notificationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(65, 'Title must be 65 characters or less'),
  message: z.string().min(1, 'Message is required').max(240, 'Message must be 240 characters or less'),
  scheduledAt: z.date().optional(),
  segments: z.array(z.string()).optional(),
});

type NotificationFormData = z.infer<typeof notificationSchema>;

interface NotificationComposerProps {
  onSuccess?: () => void;
}

export default function NotificationComposer({ onSuccess }: NotificationComposerProps) {
  const [isScheduled, setIsScheduled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: '',
      message: '',
    },
  });

  const title = watch('title', '');
  const message = watch('message', '');
  const scheduledAt = watch('scheduledAt');

  const onSubmit = async (data: NotificationFormData) => {
    setShowConfirmDialog(false);
    setIsLoading(true);

    try {
      if (isScheduled && data.scheduledAt) {
        await notificationsService.scheduleNotification({
          ...data,
          scheduledAt: data.scheduledAt,
        });
      } else {
        await notificationsService.createNotification(data);
      }

      reset();
      setIsScheduled(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to send notification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = handleSubmit(() => {
    setShowConfirmDialog(true);
  });

  const handleConfirm = handleSubmit(onSubmit);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form Column */}
      <div className="space-y-6">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter notification title"
              {...register('title')}
              className={errors.title ? 'border-red-500' : ''}
            />
            <div className="flex justify-between text-sm">
              <span className="text-red-500">{errors.title?.message}</span>
              <span className={cn('text-gray-500', title.length > 65 && 'text-red-500')}>
                {title.length}/65
              </span>
            </div>
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              placeholder="Enter notification message"
              rows={4}
              {...register('message')}
              className={errors.message ? 'border-red-500' : ''}
            />
            <div className="flex justify-between text-sm">
              <span className="text-red-500">{errors.message?.message}</span>
              <span className={cn('text-gray-500', message.length > 240 && 'text-red-500')}>
                {message.length}/240
              </span>
            </div>
          </div>

          {/* Schedule Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="schedule"
              checked={isScheduled}
              onCheckedChange={setIsScheduled}
            />
            <Label htmlFor="schedule">Schedule for later</Label>
          </div>

          {/* Scheduled Date Picker */}
          {isScheduled && (
            <div className="space-y-2">
              <Label>Schedule Date & Time</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !scheduledAt && 'text-muted-foreground',
                    )}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {scheduledAt ? format(scheduledAt, 'PPP HH:mm') : 'Pick a date and time'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledAt}
                    onSelect={(date: Date | undefined) => setValue('scheduledAt', date)}
                    disabled={(date: Date) => date < new Date()}
                    initialFocus
                  />
                  {scheduledAt && (
                    <div className="p-3 border-t">
                      <Label className="text-sm">Time</Label>
                      <Input
                        type="time"
                        value={scheduledAt ? format(scheduledAt, 'HH:mm') : ''}
                        onChange={(e) => {
                          if (scheduledAt) {
                            const [hours, minutes] = e.target.value.split(':');
                            const newDate = new Date(scheduledAt);
                            newDate.setHours(parseInt(hours), parseInt(minutes));
                            setValue('scheduledAt', newDate);
                          }
                        }}
                        className="mt-2"
                      />
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isScheduled ? 'Scheduling...' : 'Sending...'}
                </>
              ) : (
                <>
                  {isScheduled ? (
                    <>
                      <Clock className="mr-2 h-4 w-4" />
                      Schedule Notification
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Now
                    </>
                  )}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setIsScheduled(false);
              }}
            >
              Clear
            </Button>
          </div>
        </form>

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">
                Are you sure you want to {isScheduled ? 'schedule' : 'send'} this notification?
              </p>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleConfirm} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    'Confirm'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Preview Column */}
      <div className="space-y-4">
        <NotificationPreview title={title} message={message} />
      </div>
    </div>
  );
}