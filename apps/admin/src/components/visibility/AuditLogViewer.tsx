import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw, Download, Filter } from 'lucide-react';
import { systemConfigService } from '@/services/system-config.service';
import type { VisibilityAuditLog } from '@vtexday26/shared';

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<VisibilityAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sectionFilter, setSectionFilter] = useState<string>('all');

  useEffect(() => {
    loadAuditLogs();
  }, [page, sectionFilter]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await systemConfigService.getAuditLogs(
        page,
        20,
        sectionFilter === 'all' ? undefined : sectionFilter
      );
      setLogs(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAuditLogs();
  };

  const handleExport = () => {
    const csvContent = [
      ['Date', 'Section', 'Changed By', 'Action', 'Reason', 'IP Address'],
      ...logs.map((log) => [
        new Date(log.createdAt || '').toISOString(),
        log.section,
        log.changedBy,
        log.newState.isVisible ? 'Made Visible' : 'Made Hidden',
        log.changeReason || '',
        log.ipAddress || '',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visibility-audit-${new Date().toISOString()}.csv`;
    a.click();
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const getSectionBadgeColor = (section: string) => {
    const colors: Record<string, string> = {
      speakers: 'bg-blue-100 text-blue-800',
      sponsors: 'bg-green-100 text-green-800',
      sessions: 'bg-purple-100 text-purple-800',
      faq: 'bg-yellow-100 text-yellow-800',
      registration: 'bg-red-100 text-red-800',
      schedule: 'bg-indigo-100 text-indigo-800',
    };
    return colors[section] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Audit Log</CardTitle>
            <CardDescription>
              History of all visibility changes
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                <SelectItem value="speakers">Speakers</SelectItem>
                <SelectItem value="sponsors">Sponsors</SelectItem>
                <SelectItem value="sessions">Sessions</SelectItem>
                <SelectItem value="faq">FAQ</SelectItem>
                <SelectItem value="registration">Registration</SelectItem>
                <SelectItem value="schedule">Schedule</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={logs.length === 0}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No audit logs found</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Changed By</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log, index) => (
                  <TableRow key={log._id || index}>
                    <TableCell className="text-sm">
                      {formatDate(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getSectionBadgeColor(log.section)}
                      >
                        {log.section}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.changedBy}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.newState.isVisible ? 'default' : 'secondary'
                        }
                      >
                        {log.newState.isVisible ? 'Visible' : 'Hidden'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {log.changeReason || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-3">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}