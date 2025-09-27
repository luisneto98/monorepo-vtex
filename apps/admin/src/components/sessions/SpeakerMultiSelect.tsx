import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
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
import { speakersService } from '@/services/speakers.service';
import type { Speaker } from '@shared/types/speaker.types';

interface SpeakerMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function SpeakerMultiSelect({ value, onChange }: SpeakerMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpeakers, setSelectedSpeakers] = useState<Speaker[]>([]);

  useEffect(() => {
    fetchSpeakers();
  }, []);

  useEffect(() => {
    const selected = speakers.filter(speaker =>
      value && value.includes(speaker._id?.toString() || '')
    );
    setSelectedSpeakers(selected);
  }, [value, speakers]);

  const fetchSpeakers = async () => {
    try {
      setLoading(true);
      const response = await speakersService.getSpeakers({ limit: 100 });
      console.log('Speakers API response:', response);
      if (response.success && response.data) {
        console.log('Setting speakers:', response.data);
        setSpeakers(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch speakers:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSpeaker = (speakerId: string) => {
    console.log('toggleSpeaker called with:', speakerId);
    const currentValue = value || [];
    console.log('currentValue:', currentValue);
    const newValue = currentValue.includes(speakerId)
      ? currentValue.filter(id => id !== speakerId)
      : [...currentValue, speakerId];
    console.log('newValue:', newValue);
    onChange(newValue);
  };

  const removeSpeaker = (speakerId: string) => {
    onChange((value || []).filter(id => id !== speakerId));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
                ? 'Select speakers...'
                : `${value.length} speaker(s) selected`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput placeholder="Search speakers..." />
            {speakers.length === 0 && (
              <CommandEmpty>
                {loading ? 'Loading speakers...' : 'No speaker found.'}
              </CommandEmpty>
            )}
            <CommandGroup className="max-h-[300px] overflow-auto">
              {console.log('Rendering speakers:', speakers.length, speakers)}
              {speakers.map((speaker) => (
                <CommandItem
                  key={speaker._id?.toString() || ''}
                  value={speaker.name}
                  onSelect={() => {
                    console.log('Speaker selected:', speaker.name, speaker._id?.toString());
                    toggleSpeaker(speaker._id?.toString() || '');
                  }}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={speaker.photoUrl} alt={speaker.name} />
                      <AvatarFallback className="text-xs">
                        {getInitials(speaker.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 truncate">
                      <div className="text-sm font-medium">{speaker.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {speaker.position['en']} @ {speaker.company}
                      </div>
                    </div>
                  </div>
                  <Check
                    className={cn(
                      'ml-2 h-4 w-4',
                      (value || []).includes(speaker._id?.toString() || '')
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedSpeakers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSpeakers.map((speaker) => (
            <Badge
              key={speaker._id?.toString() || ''}
              variant="secondary"
              className="pr-1"
            >
              <Avatar className="h-4 w-4 mr-1">
                <AvatarImage src={speaker.photoUrl} alt={speaker.name} />
                <AvatarFallback className="text-[10px]">
                  {getInitials(speaker.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs">{speaker.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                onClick={() => removeSpeaker(speaker._id?.toString() || '')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}