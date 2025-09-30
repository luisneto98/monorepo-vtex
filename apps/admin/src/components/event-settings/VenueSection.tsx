import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { formatBrazilianCEP, fetchAddressByCEP } from '@/utils/cep-formatter';
import { Loader2 } from 'lucide-react';

export function VenueSection() {
  const { control, setValue } = useFormContext();
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Informações do Local</h3>

        <FormField
          control={control}
          name="venue.name"
          render={({ field }) => (
            <FormItem className="mb-4">
              <FormLabel>Nome do Local</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Ex: São Paulo Expo"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="venue.address"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Endereço</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Ex: Rodovia dos Imigrantes, km 1,5"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="venue.complement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Complemento</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Ex: Água Funda"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="venue.city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cidade</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Ex: São Paulo"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="venue.state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Ex: SP"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="venue.zipCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  CEP
                  {isLoadingCEP && <Loader2 data-testid="cep-loading" className="w-3 h-3 ml-2 inline animate-spin" />}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Ex: 04329-100"
                    maxLength={9}
                    onChange={async (e) => {
                      const formatted = formatBrazilianCEP(e.target.value);
                      field.onChange(formatted);

                      // Auto-fill address when CEP is complete
                      if (formatted.length === 9) {
                        setIsLoadingCEP(true);
                        const address = await fetchAddressByCEP(formatted);
                        if (address) {
                          setValue('venue.address', address.street);
                          setValue('venue.city', address.city);
                          setValue('venue.state', address.state);
                        }
                        setIsLoadingCEP(false);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}