import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronDown,
  Calendar,
  MessageSquare,
  Globe,
} from 'lucide-react';
import ScheduledActivation from './ScheduledActivation';
import type { SectionName, SectionVisibility } from '@shared/types/system-config.types';

interface SectionVisibilityCardProps {
  section: SectionName;
  title: string;
  description: string;
  visibility: SectionVisibility;
  hasChanges: boolean;
  onUpdate: (updates: any) => void;
}

export default function SectionVisibilityCard({
  section,
  title,
  description,
  visibility,
  hasChanges,
  onUpdate,
}: SectionVisibilityCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customMessagePt, setCustomMessagePt] = useState(
    visibility.customMessage?.['pt-BR'] || ''
  );
  const [customMessageEn, setCustomMessageEn] = useState(
    visibility.customMessage?.['en'] || ''
  );
  const [changeReason, setChangeReason] = useState('');

  const handleVisibilityToggle = (checked: boolean) => {
    onUpdate({
      isVisible: checked,
      changeReason,
    });
  };

  const handleCustomMessageSave = () => {
    const hasCustomMessage = customMessagePt || customMessageEn;
    onUpdate({
      customMessage: hasCustomMessage
        ? {
            'pt-BR': customMessagePt,
            'en': customMessageEn,
          }
        : undefined,
      changeReason,
    });
  };

  const handleScheduledActivation = (scheduledData: any) => {
    onUpdate({
      scheduledActivation: scheduledData,
      changeReason,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {title}
              {hasChanges && (
                <Badge variant="outline" className="text-xs">
                  Modified
                </Badge>
              )}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor={`${section}-visibility`}>
                {visibility.isVisible ? 'Visible' : 'Hidden'}
              </Label>
              <Switch
                id={`${section}-visibility`}
                checked={visibility.isVisible}
                onCheckedChange={handleVisibilityToggle}
              />
            </div>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>
      </CardHeader>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor={`${section}-reason`}>
                Change Reason (optional)
              </Label>
              <Input
                id={`${section}-reason`}
                placeholder="Reason for this change..."
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                className="mt-1"
              />
            </div>

            <Tabs defaultValue="message" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="message">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Custom Message
                </TabsTrigger>
                <TabsTrigger value="schedule">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </TabsTrigger>
                <TabsTrigger value="info">
                  <Globe className="h-4 w-4 mr-2" />
                  Info
                </TabsTrigger>
              </TabsList>

              <TabsContent value="message" className="space-y-4">
                <div>
                  <Label>Message when section is hidden (Portuguese)</Label>
                  <Textarea
                    placeholder="Esta seção estará disponível em breve..."
                    value={customMessagePt}
                    onChange={(e) => setCustomMessagePt(e.target.value)}
                    maxLength={500}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {customMessagePt.length}/500 characters
                  </p>
                </div>
                <div>
                  <Label>Message when section is hidden (English)</Label>
                  <Textarea
                    placeholder="This section will be available soon..."
                    value={customMessageEn}
                    onChange={(e) => setCustomMessageEn(e.target.value)}
                    maxLength={500}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {customMessageEn.length}/500 characters
                  </p>
                </div>
                <Button
                  onClick={handleCustomMessageSave}
                  variant="outline"
                  size="sm"
                >
                  Save Custom Message
                </Button>
              </TabsContent>

              <TabsContent value="schedule">
                <ScheduledActivation
                  currentActivation={visibility.scheduledActivation}
                  onSchedule={handleScheduledActivation}
                />
              </TabsContent>

              <TabsContent value="info" className="space-y-2">
                <div className="text-sm">
                  <p>
                    <span className="font-medium">Last Changed:</span>{' '}
                    {visibility.lastChanged
                      ? new Date(visibility.lastChanged).toLocaleString()
                      : 'Never'}
                  </p>
                  <p>
                    <span className="font-medium">Changed By:</span>{' '}
                    {visibility.changedBy || 'System'}
                  </p>
                  {visibility.changeReason && (
                    <p>
                      <span className="font-medium">Reason:</span>{' '}
                      {visibility.changeReason}
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}