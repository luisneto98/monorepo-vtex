import { useState } from 'react';
import { Download, Eye, EyeOff, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import { SponsorsService } from '@/services/sponsors.service';

interface SponsorBulkActionsProps {
  selectedSponsors: string[];
  onAction: () => void;
  tiers: string[];
}

export function SponsorBulkActions({ selectedSponsors, onAction, tiers }: SponsorBulkActionsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleToggleVisibility = async (visible: boolean) => {
    try {
      setLoading(true);
      await SponsorsService.bulkUpdateVisibility(selectedSponsors, visible);
      toast({
        title: 'Success',
        description: `${selectedSponsors.length} sponsors ${visible ? 'shown' : 'hidden'} successfully`,
      });
      onAction();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update sponsor visibility',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeTier = async (tier: string) => {
    try {
      setLoading(true);
      await SponsorsService.bulkChangeTier(selectedSponsors, tier);
      toast({
        title: 'Success',
        description: `${selectedSponsors.length} sponsors moved to ${tier} tier`,
      });
      onAction();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to change sponsor tiers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      setLoading(true);
      const data = await SponsorsService.exportSponsors(selectedSponsors, format);

      // Create download link
      const blob = new Blob([data], {
        type: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sponsors-export-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: `Exported ${selectedSponsors.length} sponsors to ${format.toUpperCase()}`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to export sponsors',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    try {
      setLoading(true);
      await SponsorsService.bulkArchive(selectedSponsors);
      toast({
        title: 'Success',
        description: `${selectedSponsors.length} sponsors archived successfully`,
      });
      onAction();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to archive sponsors',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (selectedSponsors.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
      <span className="text-sm font-medium">
        {selectedSponsors.length} sponsor{selectedSponsors.length > 1 ? 's' : ''} selected
      </span>

      <div className="flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={loading}>
              <Eye className="h-4 w-4 mr-2" />
              Visibility
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Change Visibility</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleToggleVisibility(true)}>
              <Eye className="h-4 w-4 mr-2" />
              Make Visible
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleVisibility(false)}>
              <EyeOff className="h-4 w-4 mr-2" />
              Hide
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Select onValueChange={handleChangeTier} disabled={loading}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Change Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cancel" disabled>Select a tier</SelectItem>
            {tiers.map((tier) => (
              <SelectItem key={tier} value={tier}>
                {tier}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={loading}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Export Format</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleExport('csv')}>
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('excel')}>
              Export as Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          onClick={handleArchive}
          disabled={loading}
        >
          <Archive className="h-4 w-4 mr-2" />
          Archive
        </Button>
      </div>
    </div>
  );
}