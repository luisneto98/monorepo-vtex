import { useState } from 'react';
import { useForm, type ControllerRenderProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Users } from 'lucide-react';
import type { ISession } from '@shared/types/session.types';
import { SpeakerMultiSelect } from './SpeakerMultiSelect';
import { SponsorMultiSelect } from './SponsorMultiSelect';
import { TagsInput } from '@/components/ui/tags-input';
import { useToast } from '@/hooks/useToast';

const sessionSchema = z.object({
  title: z.object({
    'pt-BR': z.string().min(1, 'Title in Portuguese is required'),
    'en': z.string().min(1, 'Title in English is required'),
  }),
  description: z.object({
    'pt-BR': z.string().min(1, 'Description in Portuguese is required'),
    'en': z.string().min(1, 'Description in English is required'),
  }),
  type: z.enum(['keynote', 'talk', 'panel', 'workshop', 'networking', 'break']),
  speakerIds: z.array(z.string()).min(1, 'At least one speaker is required'),
  sponsorIds: z.array(z.string()).optional(),
  startDate: z.date().refine(val => val !== undefined, {
    message: 'Start date is required',
  }),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  stage: z.enum(['principal', 'inovacao', 'tech', 'startup', 'workshop_a', 'workshop_b']),
  capacity: z.number().min(1, 'Capacity must be at least 1').optional(),
  tags: z.array(z.string()),
  isHighlight: z.boolean(),
  isVisible: z.boolean(),
});

type SessionFormValues = z.infer<typeof sessionSchema>;

interface SessionFormProps {
  session?: ISession | null;
  onSubmit: (values: Omit<ISession, '_id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

export function SessionForm({ session, onSubmit, onCancel }: SessionFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      title: session?.title || { 'pt-BR': '', 'en': '' },
      description: session?.description || { 'pt-BR': '', 'en': '' },
      type: session?.type || 'talk',
      speakerIds: session?.speakerIds?.map(speaker =>
        typeof speaker === 'string' ? speaker : (speaker as any)._id?.toString() || speaker.toString()
      ) || [],
      sponsorIds: session?.sponsorIds?.map(sponsor =>
        typeof sponsor === 'string' ? sponsor : (sponsor as any)._id?.toString() || sponsor.toString()
      ) || [],
      startDate: session?.startTime ? new Date(session.startTime) : undefined,
      startTime: session?.startTime ? format(new Date(session.startTime), 'HH:mm') : '',
      endTime: session?.endTime ? format(new Date(session.endTime), 'HH:mm') : '',
      stage: (session?.stage as any) || 'principal',
      capacity: session?.capacity,
      tags: session?.tags || [],
      isHighlight: session?.isHighlight || false,
      isVisible: session?.isVisible || true,
    },
  });

  const handleSubmit = async (values: SessionFormValues) => {
    setLoading(true);
    try {
      const startDateTime = new Date(values.startDate);
      const [startHour, startMin] = values.startTime.split(':');
      startDateTime.setHours(parseInt(startHour), parseInt(startMin));

      const endDateTime = new Date(values.startDate);
      const [endHour, endMin] = values.endTime.split(':');
      endDateTime.setHours(parseInt(endHour), parseInt(endMin));

      const sessionData = {
        title: values.title,
        description: values.description,
        type: values.type,
        startTime: startDateTime,
        endTime: endDateTime,
        stage: values.stage,
        speakerIds: values.speakerIds,
        sponsorIds: values.sponsorIds || [],
        tags: values.tags,
        capacity: values.capacity,
        isHighlight: values.isHighlight,
        isVisible: values.isVisible,
      };

      await onSubmit(sessionData as any);
      toast({
        title: 'Success',
        description: session ? 'Session updated successfully' : 'Session created successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to save session',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sessionTypes = [
    { value: 'keynote', label: 'Keynote' },
    { value: 'talk', label: 'Talk' },
    { value: 'panel', label: 'Panel' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'networking', label: 'Networking' },
    { value: 'break', label: 'Break' },
  ];

  const stages = [
    { value: 'principal', label: 'Principal Stage' },
    { value: 'inovacao', label: 'Innovation Stage' },
    { value: 'tech', label: 'Tech Stage' },
    { value: 'startup', label: 'Startup Stage' },
    { value: 'workshop_a', label: 'Workshop Room A' },
    { value: 'workshop_b', label: 'Workshop Room B' },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs defaultValue="pt-BR" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pt-BR">Português</TabsTrigger>
            <TabsTrigger value="en">English</TabsTrigger>
          </TabsList>

          <TabsContent value="pt-BR" className="space-y-4">
            <FormField
              control={form.control}
              name="title.pt-BR"
              render={({ field }: { field: ControllerRenderProps<SessionFormValues, "title.pt-BR"> }) => (
                <FormItem>
                  <FormLabel>Título (PT)</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o título em português" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description.pt-BR"
              render={({ field }: { field: ControllerRenderProps<SessionFormValues, "description.pt-BR"> }) => (
                <FormItem>
                  <FormLabel>Descrição (PT)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Digite a descrição em português"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="en" className="space-y-4">
            <FormField
              control={form.control}
              name="title.en"
              render={({ field }: { field: ControllerRenderProps<SessionFormValues, "title.en"> }) => (
                <FormItem>
                  <FormLabel>Title (EN)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter title in English" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description.en"
              render={({ field }: { field: ControllerRenderProps<SessionFormValues, "description.en"> }) => (
                <FormItem>
                  <FormLabel>Description (EN)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter description in English"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }: { field: ControllerRenderProps<SessionFormValues, "type"> }) => (
              <FormItem>
                <FormLabel>Session Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select session type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sessionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stage"
            render={({ field }: { field: ControllerRenderProps<SessionFormValues, "stage"> }) => (
              <FormItem>
                <FormLabel>Stage/Room</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a stage" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="startDate"
          render={({ field }: { field: ControllerRenderProps<SessionFormValues, "startDate"> }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : undefined;
                    field.onChange(date);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }: { field: ControllerRenderProps<SessionFormValues, "startTime"> }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="time" className="pl-8" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endTime"
            render={({ field }: { field: ControllerRenderProps<SessionFormValues, "endTime"> }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="time" className="pl-8" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="capacity"
            render={({ field }: { field: ControllerRenderProps<SessionFormValues, "capacity"> }) => (
              <FormItem>
                <FormLabel>Capacity</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Users className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      className="pl-8"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="speakerIds"
          render={({ field }: { field: ControllerRenderProps<SessionFormValues, "speakerIds"> }) => (
            <FormItem>
              <FormLabel>Speakers</FormLabel>
              <FormControl>
                <SpeakerMultiSelect
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sponsorIds"
          render={({ field }: { field: ControllerRenderProps<SessionFormValues, "sponsorIds"> }) => (
            <FormItem>
              <FormLabel>Sponsors</FormLabel>
              <FormControl>
                <SponsorMultiSelect
                  value={field.value || []}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }: { field: ControllerRenderProps<SessionFormValues, "tags"> }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <TagsInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Add tags..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-6">
          <FormField
            control={form.control}
            name="isHighlight"
            render={({ field }: { field: ControllerRenderProps<SessionFormValues, "isHighlight"> }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="!mt-0">Highlight Session</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isVisible"
            render={({ field }: { field: ControllerRenderProps<SessionFormValues, "isVisible"> }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="!mt-0">Visible to Public</FormLabel>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : session ? 'Update Session' : 'Create Session'}
          </Button>
        </div>
      </form>
    </Form>
  );
}