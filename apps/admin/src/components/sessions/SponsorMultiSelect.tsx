import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, X, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SponsorsService } from '@/services/sponsors.service';
import type { Sponsor } from '@shared/types/sponsor.types';

interface SponsorMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  maxSponsors?: number;
}

export function SponsorMultiSelect({
  value,
  onChange,
  maxSponsors = 5
}: SponsorMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSponsors, setSelectedSponsors] = useState<Sponsor[]>([]);

  useEffect(() => {
    fetchSponsors();
  }, []);

  useEffect(() => {
    const selected = sponsors.filter(sponsor =>
      value && value.includes(sponsor._id?.toString() || '')
    );
    setSelectedSponsors(selected);
  }, [value, sponsors]);

  const fetchSponsors = async () => {
    try {
      setLoading(true);
      const response = await SponsorsService.getSponsors({ limit: 100 });
      if (response.success && response.data) {
        setSponsors(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch sponsors:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSponsor = (sponsorId: string) => {
    const currentValue = value || [];
    if (currentValue.includes(sponsorId)) {
      onChange(currentValue.filter(id => id !== sponsorId));
    } else if (currentValue.length < maxSponsors) {
      onChange([...currentValue, sponsorId]);
    }
  };

  const removeSponsor = (sponsorId: string) => {
    onChange((value || []).filter(id => id !== sponsorId));
  };

  const getTierColor = (tier?: string) => {
    const tierStr = typeof tier === 'string' ? tier.toLowerCase() : '';
    switch (tierStr) {
      case 'diamond':
        return 'bg-purple-100 text-purple-800';
      case 'platinum':
        return 'bg-slate-100 text-slate-800';
      case 'gold':
        return 'bg-yellow-100 text-yellow-800';
      case 'silver':
        return 'bg-gray-100 text-gray-800';
      case 'bronze':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const sortedSponsors = [...sponsors].sort((a, b) => {
    const tierOrder = ['diamond', 'platinum', 'gold', 'silver', 'bronze'];
    const aTier = typeof a.tier === 'string' ? a.tier.toLowerCase() : 'bronze';
    const bTier = typeof b.tier === 'string' ? b.tier.toLowerCase() : 'bronze';
    return tierOrder.indexOf(aTier) - tierOrder.indexOf(bTier);
  });

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="text-left truncate">
              {!value || value.length === 0
                ? 'Select sponsors...'
                : `${value.length} sponsor(s) selected`}
            </span>
            <div className="flex items-center gap-1">
              {value && value.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {value.length}/{maxSponsors}
                </Badge>
              )}
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput placeholder="Search sponsors..." />
            <CommandEmpty>
              {loading ? 'Loading sponsors...' : 'No sponsor found.'}
            </CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {sortedSponsors.map((sponsor) => {
                const isSelected = (value || []).includes(sponsor._id?.toString() || '');
                const isDisabled = !isSelected && (value || []).length >= maxSponsors;

                return (
                  <CommandItem
                    key={sponsor._id?.toString() || ''}
                    value={sponsor.name}
                    onSelect={() => !isDisabled && toggleSponsor(sponsor._id?.toString() || '')}
                    className={cn(
                      isDisabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={sponsor.logoUrl} alt={sponsor.name} />
                        <AvatarFallback className="text-xs">
                          <Building2 className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{sponsor.name}</span>
                          {sponsor.tier && (
                            <Badge
                              variant="outline"
                              className={cn('text-[10px] px-1 py-0', getTierColor(sponsor.tier))}
                            >
                              {sponsor.tier}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {sponsor.websiteUrl}
                        </div>
                      </div>
                    </div>
                    <Check
                      className={cn(
                        'ml-2 h-4 w-4',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedSponsors.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            Selected sponsors (ordered by tier):
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedSponsors
              .sort((a, b) => {
                const tierOrder = ['diamond', 'platinum', 'gold', 'silver', 'bronze'];
                const aTier = typeof a.tier === 'string' ? a.tier.toLowerCase() : 'bronze';
                const bTier = typeof b.tier === 'string' ? b.tier.toLowerCase() : 'bronze';
                return tierOrder.indexOf(aTier) - tierOrder.indexOf(bTier);
              })
              .map((sponsor) => (
                <Badge
                  key={sponsor._id?.toString() || ''}
                  variant="secondary"
                  className="pr-1 flex items-center gap-1"
                >
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={sponsor.logoUrl} alt={sponsor.name} />
                    <AvatarFallback className="text-[10px]">
                      <Building2 className="h-2 w-2" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs">{sponsor.name}</span>
                  {sponsor.tier && (
                    <Badge
                      variant="outline"
                      className={cn('text-[10px] px-1 py-0 ml-1', getTierColor(sponsor.tier))}
                    >
                      {sponsor.tier}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                    onClick={() => removeSponsor(sponsor._id?.toString() || '')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
          </div>
        </div>
      )}

      {value && value.length >= maxSponsors && (
        <p className="text-xs text-amber-600">
          Maximum number of sponsors reached ({maxSponsors})
        </p>
      )}
    </div>
  );
}