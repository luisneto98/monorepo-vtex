import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function EventBasicInfo() {
  const { control } = useFormContext();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Nome do Evento</h3>
        <Tabs defaultValue="pt" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pt">Português</TabsTrigger>
            <TabsTrigger value="en">English</TabsTrigger>
            <TabsTrigger value="es">Español</TabsTrigger>
          </TabsList>

          <TabsContent value="pt">
            <FormField
              control={control}
              name="eventName.pt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome em Português</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="VTEX Day 2026"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="en">
            <FormField
              control={control}
              name="eventName.en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome em Inglês</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="VTEX Day 2026"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="es">
            <FormField
              control={control}
              name="eventName.es"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome em Espanhol</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="VTEX Day 2026"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Início</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="datetime-local"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Término</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="datetime-local"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}