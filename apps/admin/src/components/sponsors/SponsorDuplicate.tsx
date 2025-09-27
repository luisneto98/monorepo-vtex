import { useState } from 'react';
import { Copy } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';
import { SponsorsService } from '@/services/sponsors.service';
import type { Sponsor } from '@shared/types/sponsor.types';

interface SponsorDuplicateProps {
  sponsor: Sponsor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SponsorDuplicate({ sponsor, open, onOpenChange, onSuccess }: SponsorDuplicateProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');

  const handleDuplicate = async () => {
    if (!sponsor || !newName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name for the duplicated sponsor',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const duplicatedSponsor = {
        ...sponsor,
        _id: undefined,
        name: newName,
        slug: newName.toLowerCase().replace(/\s+/g, '-'),
        adminEmail: '', // Clear admin email for duplicate
        contactEmail: '', // Clear contact email for duplicate
        postsUsed: 0, // Reset posts usage
        createdAt: undefined,
        updatedAt: undefined,
      };

      await SponsorsService.createSponsor(duplicatedSponsor);

      toast({
        title: 'Success',
        description: `Sponsor "${newName}" created as a copy of "${sponsor.name}"`,
      });

      setNewName('');
      onOpenChange(false);
      onSuccess();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to duplicate sponsor',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Copy className="inline-block h-5 w-5 mr-2" />
            Duplicate Sponsor
          </DialogTitle>
          <DialogDescription>
            Create a copy of "{sponsor?.name}" with a new name. All settings except email addresses and usage statistics will be copied.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="original-name">Original Sponsor</Label>
            <Input
              id="original-name"
              value={sponsor?.name || ''}
              disabled
              className="opacity-60"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="new-name">New Sponsor Name</Label>
            <Input
              id="new-name"
              placeholder="Enter name for the duplicated sponsor"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={loading}
            />
          </div>

          {sponsor && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium mb-2">The following will be copied:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Tier: {sponsor.tier}</li>
                <li>• Description and translations</li>
                <li>• Logo URL</li>
                <li>• Website URL</li>
                <li>• Stand location</li>
                <li>• Social links</li>
                <li>• Max posts limit: {sponsor.maxPosts || 'Inherited from tier'}</li>
                <li>• Visibility settings</li>
                <li>• Tags</li>
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDuplicate}
            disabled={loading || !newName.trim()}
          >
            {loading ? 'Duplicating...' : 'Duplicate Sponsor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}