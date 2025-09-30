import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { EventBasicInfo } from '@/components/event-settings/EventBasicInfo';
import { VenueSection } from '@/components/event-settings/VenueSection';
import { ContactSection } from '@/components/event-settings/ContactSection';
import { SocialMediaSection } from '@/components/event-settings/SocialMediaSection';
import { MapSelector } from '@/components/event-settings/MapSelector';
import { EventSettingsErrorBoundary } from '@/components/event-settings/EventSettingsErrorBoundary';
import { useEventSettings } from '@/hooks/useEventSettings';
import { Loader2 } from 'lucide-react';
import type { UpdateEventSettingsDto } from '@shared/types/event-settings';

const eventSettingsSchema = z.object({
  eventName: z.object({
    pt: z.string().min(1, 'Nome em português é obrigatório'),
    en: z.string().min(1, 'Nome em inglês é obrigatório'),
    es: z.string().min(1, 'Nome em espanhol é obrigatório'),
  }),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().min(1, 'Data de término é obrigatória'),
  venue: z.object({
    name: z.string().min(1, 'Nome do local é obrigatório'),
    address: z.string().min(1, 'Endereço é obrigatório'),
    city: z.string().min(1, 'Cidade é obrigatória'),
    state: z.string().min(1, 'Estado é obrigatório'),
    zipCode: z.string().min(1, 'CEP é obrigatório'),
    complement: z.string().optional(),
  }),
  mapCoordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  contact: z.object({
    email: z.string().email('Email inválido'),
    phone: z.string().min(1, 'Telefone é obrigatório'),
    whatsapp: z.string().optional(),
  }),
  socialMedia: z.object({
    facebook: z.string().url('URL inválida').or(z.literal('')).optional(),
    twitter: z.string().url('URL inválida').or(z.literal('')).optional(),
    instagram: z.string().url('URL inválida').or(z.literal('')).optional(),
    linkedin: z.string().url('URL inválida').or(z.literal('')).optional(),
    youtube: z.string().url('URL inválida').or(z.literal('')).optional(),
  }),
});

type EventSettingsFormData = z.infer<typeof eventSettingsSchema>;

function EventSettingsContent() {
  const { toast } = useToast();
  const { data: settings, isLoading, updateSettings, isUpdating } = useEventSettings();

  const methods = useForm<EventSettingsFormData>({
    resolver: zodResolver(eventSettingsSchema),
    defaultValues: {
      eventName: { pt: '', en: '', es: '' },
      startDate: '',
      endDate: '',
      venue: {
        name: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        complement: '',
      },
      mapCoordinates: {
        latitude: -23.5505,
        longitude: -46.6333,
      },
      contact: {
        email: '',
        phone: '',
        whatsapp: '',
      },
      socialMedia: {
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: '',
        youtube: '',
      },
    },
  });

  React.useEffect(() => {
    if (settings) {
      const formatDateTime = (date: string | Date): string => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toISOString().slice(0, 16);
      };

      const formData: EventSettingsFormData = {
        eventName: settings.eventName,
        startDate: formatDateTime(settings.startDate),
        endDate: formatDateTime(settings.endDate),
        venue: settings.venue,
        mapCoordinates: settings.mapCoordinates,
        contact: settings.contact,
        socialMedia: settings.socialMedia || {},
      };
      methods.reset(formData);
    }
  }, [settings, methods]);

  const onSubmit = async (data: EventSettingsFormData) => {
    try {
      await updateSettings(data as UpdateEventSettingsDto);
      toast({
        title: 'Configurações salvas',
        description: 'As configurações do evento foram atualizadas com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar as configurações. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleReset = () => {
    if (settings) {
      const formatDateTime = (date: string | Date): string => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toISOString().slice(0, 16);
      };

      const formData: EventSettingsFormData = {
        eventName: settings.eventName,
        startDate: formatDateTime(settings.startDate),
        endDate: formatDateTime(settings.endDate),
        venue: settings.venue,
        mapCoordinates: settings.mapCoordinates,
        contact: settings.contact,
        socialMedia: settings.socialMedia || {},
      };
      methods.reset(formData);
      toast({
        title: 'Formulário resetado',
        description: 'As alterações foram descartadas.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Configurações Gerais do Evento</CardTitle>
            <CardDescription>
              Gerencie as informações básicas do VTEX Day 2026
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                <TabsTrigger value="venue">Local</TabsTrigger>
                <TabsTrigger value="contact">Contato</TabsTrigger>
                <TabsTrigger value="social">Redes Sociais</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <EventBasicInfo />
              </TabsContent>

              <TabsContent value="venue" className="space-y-4">
                <VenueSection />
                <MapSelector />
              </TabsContent>

              <TabsContent value="contact" className="space-y-4">
                <ContactSection />
              </TabsContent>

              <TabsContent value="social" className="space-y-4">
                <SocialMediaSection />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-4 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isUpdating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </FormProvider>
  );
}

export default function EventSettings() {
  return (
    <EventSettingsErrorBoundary>
      <EventSettingsContent />
    </EventSettingsErrorBoundary>
  );
}