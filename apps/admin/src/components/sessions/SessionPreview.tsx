import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Globe,
  Monitor,
  Smartphone,
  Building2,
  Star,
  Tag,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import type { ISession } from '@shared/types/session.types';
import { cn } from '@/lib/utils';

interface SessionPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: ISession;
}

export function SessionPreview({ open, onOpenChange, session }: SessionPreviewProps) {
  const [language, setLanguage] = useState<'pt-BR' | 'en'>('pt-BR');
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>('desktop');

  const formatDuration = (start: Date, end: Date) => {
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const getTechnicalLevelLabel = (level?: string) => {
    const labels = {
      beginner: { 'pt-BR': 'Iniciante', 'en': 'Beginner' },
      intermediate: { 'pt-BR': 'Intermediário', 'en': 'Intermediate' },
      advanced: { 'pt-BR': 'Avançado', 'en': 'Advanced' },
    };
    return labels[level as keyof typeof labels]?.[language] || level;
  };

  const getLanguageLabel = (lang?: string) => {
    const labels = {
      'pt-BR': { 'pt-BR': 'Português', 'en': 'Portuguese' },
      'en': { 'pt-BR': 'Inglês', 'en': 'English' },
      'es': { 'pt-BR': 'Espanhol', 'en': 'Spanish' },
    };
    return labels[lang as keyof typeof labels]?.[language] || lang;
  };

  const AgendaView = () => (
    <Card className={cn(
      'w-full',
      deviceView === 'mobile' ? 'max-w-sm mx-auto' : ''
    )}>
      <CardHeader className="pb-3">
        {session.isHighlight && (
          <Badge className="w-fit mb-2" variant="default">
            <Star className="mr-1 h-3 w-3" />
            {language === 'pt-BR' ? 'Destaque' : 'Highlight'}
          </Badge>
        )}

        <h3 className={cn(
          'font-bold',
          deviceView === 'mobile' ? 'text-lg' : 'text-xl'
        )}>
          {session.title[language]}
        </h3>

        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline" className="text-xs">
            <Calendar className="mr-1 h-3 w-3" />
            {format(parseISO(session.startTime.toString()), 'dd/MM', {
              locale: language === 'pt-BR' ? ptBR : enUS,
            })}
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Clock className="mr-1 h-3 w-3" />
            {format(parseISO(session.startTime.toString()), 'HH:mm')} -
            {format(parseISO(session.endTime.toString()), 'HH:mm')}
          </Badge>
          <Badge variant="outline" className="text-xs">
            <MapPin className="mr-1 h-3 w-3" />
            {session.stage}
          </Badge>
          {session.capacity && (
            <Badge variant="outline" className="text-xs">
              <Users className="mr-1 h-3 w-3" />
              {session.capacity} {language === 'pt-BR' ? 'vagas' : 'seats'}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className={cn(
          'text-muted-foreground mb-4',
          deviceView === 'mobile' ? 'text-sm' : ''
        )}>
          {session.description[language]}
        </p>

        {/* Speakers Section */}
        {session.speakerIds && session.speakerIds.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">
              {language === 'pt-BR' ? 'Palestrantes' : 'Speakers'}
            </h4>
            <div className="space-y-2">
              {/* Mock speaker data for preview */}
              {session.speakerIds.map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>SP</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">Speaker {index + 1}</p>
                    <p className="text-xs text-muted-foreground">Role/Company</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sponsors Section */}
        {session.sponsorIds && session.sponsorIds.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">
              {language === 'pt-BR' ? 'Patrocinadores' : 'Sponsors'}
            </h4>
            <div className="flex flex-wrap gap-2">
              {/* Mock sponsor logos for preview */}
              {session.sponsorIds.map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50"
                >
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs">Sponsor {index + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags and Metadata */}
        <div className="space-y-2">
          {session.tags && session.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {session.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  <Tag className="mr-1 h-2 w-2" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {session.technicalLevel && (
              <span>
                {language === 'pt-BR' ? 'Nível' : 'Level'}:{' '}
                {getTechnicalLevelLabel(session.technicalLevel)}
              </span>
            )}
            {session.language && (
              <span>
                <Globe className="inline mr-1 h-3 w-3" />
                {getLanguageLabel(session.language)}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons (in real app view) */}
        {deviceView === 'desktop' && (
          <div className="mt-4 pt-4 border-t">
            <Button className="w-full">
              {language === 'pt-BR' ? 'Inscrever-se' : 'Register'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Session Preview</DialogTitle>
          <DialogDescription>
            See how your session will appear to attendees
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={language === 'pt-BR' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLanguage('pt-BR')}
              >
                Português
              </Button>
              <Button
                variant={language === 'en' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLanguage('en')}
              >
                English
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant={deviceView === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDeviceView('desktop')}
              >
                <Monitor className="mr-1 h-4 w-4" />
                Desktop
              </Button>
              <Button
                variant={deviceView === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDeviceView('mobile')}
              >
                <Smartphone className="mr-1 h-4 w-4" />
                Mobile
              </Button>
            </div>
          </div>

          {/* Preview Tabs */}
          <Tabs defaultValue="agenda" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="agenda">Agenda View</TabsTrigger>
              <TabsTrigger value="detail">Detail View</TabsTrigger>
              <TabsTrigger value="card">Card View</TabsTrigger>
            </TabsList>

            <TabsContent value="agenda" className="mt-4">
              <div className={cn(
                'border rounded-lg p-4',
                deviceView === 'mobile' ? 'max-w-sm mx-auto' : ''
              )}>
                <AgendaView />
              </div>
            </TabsContent>

            <TabsContent value="detail" className="mt-4">
              <div className={cn(
                'border rounded-lg p-4',
                deviceView === 'mobile' ? 'max-w-sm mx-auto' : ''
              )}>
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold">{session.title[language]}</h2>
                    <p className="text-muted-foreground mt-2">
                      {session.description[language]}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h3 className="font-medium">
                        {language === 'pt-BR' ? 'Informações' : 'Information'}
                      </h3>
                      <div className="text-sm space-y-1">
                        <p>
                          <strong>{language === 'pt-BR' ? 'Data:' : 'Date:'}</strong>{' '}
                          {format(parseISO(session.startTime.toString()), 'PPP', {
                            locale: language === 'pt-BR' ? ptBR : enUS,
                          })}
                        </p>
                        <p>
                          <strong>{language === 'pt-BR' ? 'Horário:' : 'Time:'}</strong>{' '}
                          {format(parseISO(session.startTime.toString()), 'HH:mm')} -{' '}
                          {format(parseISO(session.endTime.toString()), 'HH:mm')}
                        </p>
                        <p>
                          <strong>{language === 'pt-BR' ? 'Duração:' : 'Duration:'}</strong>{' '}
                          {formatDuration(session.startTime, session.endTime)}
                        </p>
                        <p>
                          <strong>{language === 'pt-BR' ? 'Local:' : 'Location:'}</strong>{' '}
                          {session.stage}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="card" className="mt-4">
              <div className={cn(
                'border rounded-lg p-4',
                deviceView === 'mobile' ? 'max-w-sm mx-auto' : ''
              )}>
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-sm mb-1">{session.title[language]}</h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      {format(parseISO(session.startTime.toString()), 'HH:mm')} • {session.stage}
                    </p>
                    <div className="flex gap-1">
                      {session.tags?.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}