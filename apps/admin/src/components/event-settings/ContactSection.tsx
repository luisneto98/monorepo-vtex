import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Mail, Phone, MessageSquare } from 'lucide-react';
import { formatPhoneMemoized } from '@/utils/phone-formatter';

export function ContactSection() {
  const { control } = useFormContext();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Informações de Contato</h3>

        <div className="space-y-4">
          <FormField
            control={control}
            name="contactInfo.email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="contato@vtexday.com.br"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="contactInfo.phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefone
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="(11) 99999-9999"
                    onChange={(e) => {
                      const formatted = formatPhoneMemoized(e.target.value);
                      field.onChange(formatted);
                    }}
                    maxLength={15}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="contactInfo.whatsapp"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp (Opcional)
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="(11) 99999-9999"
                    onChange={(e) => {
                      const formatted = formatPhoneMemoized(e.target.value);
                      field.onChange(formatted);
                    }}
                    maxLength={15}
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