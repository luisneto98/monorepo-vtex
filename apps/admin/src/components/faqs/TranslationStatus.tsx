import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Copy, Languages } from 'lucide-react';

interface TranslationStatusProps {
  translations: {
    'pt-BR': boolean;
    'en': boolean;
  };
  onCopy?: (from: 'pt-BR' | 'en', to: 'pt-BR' | 'en') => void;
  currentLang?: 'pt-BR' | 'en';
}

export function TranslationStatus({ translations, onCopy, currentLang }: TranslationStatusProps) {
  const completedCount = Object.values(translations).filter(Boolean).length;
  const totalCount = Object.keys(translations).length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Translation Status</span>
          </div>
          <Badge variant={percentage === 100 ? 'default' : 'secondary'}>
            {percentage}% Complete
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {translations['pt-BR'] ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm">Português (PT-BR)</span>
            </div>
            {onCopy && currentLang === 'en' && translations['pt-BR'] && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onCopy('pt-BR', 'en')}
                className="h-7 px-2"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy to EN
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {translations['en'] ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm">English (EN)</span>
            </div>
            {onCopy && currentLang === 'pt-BR' && translations['en'] && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onCopy('en', 'pt-BR')}
                className="h-7 px-2"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy to PT
              </Button>
            )}
          </div>
        </div>

        {!translations['en'] && translations['pt-BR'] && (
          <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-800 dark:text-yellow-200">
            English translation is pending
          </div>
        )}
      </CardContent>
    </Card>
  );
}