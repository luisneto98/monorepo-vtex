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
            name="venue.address.street"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rua</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Ex: Rodovia dos Imigrantes"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="venue.address.number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Ex: 1500"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="venue.address.complement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Complemento</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Ex: Pavilhão 3"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="venue.address.neighborhood"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bairro</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Ex: Vila Água Funda"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="venue.address.city"
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
            name="venue.address.state"
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
            name="venue.address.zipCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  CEP
                  {isLoadingCEP && <Loader2 data-testid="cep-loading" className="w-3 h-3 ml-2 inline animate-spin" />}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Ex: 04329-000"
                    maxLength={9}
                    onChange={async (e) => {
                      const formatted = formatBrazilianCEP(e.target.value);
                      field.onChange(formatted);

                      // Auto-fill address when CEP is complete
                      if (formatted.length === 9) {
                        setIsLoadingCEP(true);
                        const address = await fetchAddressByCEP(formatted);
                        if (address) {
                          setValue('venue.address.street', address.street);
                          setValue('venue.address.neighborhood', address.neighborhood);
                          setValue('venue.address.city', address.city);
                          setValue('venue.address.state', address.state);
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

          <FormField
            control={control}
            name="venue.address.country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>País</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Ex: Brasil"
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