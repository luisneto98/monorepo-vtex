interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'warning';
}

export function useToast() {
  const toast = (options: ToastOptions) => {
    // Simple console implementation for now
    // In production, this would integrate with a toast library
    const prefix = options.variant === 'destructive' ? '❌' :
                   options.variant === 'warning' ? '⚠️' : '✅';
    console.log(`${prefix} ${options.title}${options.description ? ': ' + options.description : ''}`);
  };

  return { toast };
}