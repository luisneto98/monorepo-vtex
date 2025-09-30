import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import notificationsService, { type Notification } from '@/services/notifications.service';

export default function NotificationHistory() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const result = await notificationsService.getHistory(page, 10, undefined, undefined, search);
      setNotifications(result.data);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Failed to fetch notification history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-500">Sent</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification History</CardTitle>
        <div className="flex gap-2 mt-4">
          <Input
            placeholder="Search by title or message..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No notifications found
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead>Delivered</TableHead>
                  <TableHead>Failed</TableHead>
                  <TableHead>Sender</TableHead>
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
                      {getStatusBadge(notification.status)}
                    </TableCell>
                    <TableCell>
                      {notification.sentAt
                        ? format(new Date(notification.sentAt), 'PPp')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <span className="text-green-600 font-semibold">
                        {notification.deliveredCount || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-red-600 font-semibold">
                        {notification.failedCount || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      {notification.createdBy.name}
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
  );
}