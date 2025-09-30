import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Loader2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import notificationsService, { type Notification } from '@/services/notifications.service';
import { useToast } from '@/hooks/useToast';

export default function NotificationScheduled() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  const fetchScheduled = async () => {
    setIsLoading(true);
    try {
      const result = await notificationsService.getScheduledNotifications(page, 10);
      setNotifications(result.data);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Failed to fetch scheduled notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduled();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleCancel = async () => {
    if (!cancelDialog.id) return;

    try {
      await notificationsService.cancelScheduledNotification(cancelDialog.id);
      toast({
        title: 'Success',
        description: 'Scheduled notification cancelled',
      });
      fetchScheduled();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to cancel notification',
        variant: 'destructive',
      });
    } finally {
      setCancelDialog({ open: false, id: null });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No scheduled notifications
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Scheduled For</TableHead>
                    <TableHead>Target Devices</TableHead>
                    <TableHead>Scheduled By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((notification) => (
                    <TableRow key={notification._id}>
                      <TableCell className="font-medium max-w-xs truncate">
                        {notification.title}
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {notification.message}
                      </TableCell>
                      <TableCell>
                        {notification.scheduledAt
                          ? format(new Date(notification.scheduledAt), 'PPp')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{notification.deviceCount} devices</Badge>
                      </TableCell>
                      <TableCell>
                        {notification.createdBy.name}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            setCancelDialog({ open: true, id: notification._id })
                          }
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialog.open} onOpenChange={(open) => setCancelDialog({ open, id: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Scheduled Notification?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The notification will not be sent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep it</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-red-500">
              Yes, cancel it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}