import { toast as sonnerToast } from 'sonner';

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

export function useToast() {
  const toast = ({ title, description, variant = 'default' }: ToastOptions) => {
    const message = title || description;

    switch (variant) {
      case 'destructive':
        sonnerToast.error(message, {
          description: title ? description : undefined,
        });
        break;
      case 'success':
        sonnerToast.success(message, {
          description: title ? description : undefined,
        });
        break;
      default:
        sonnerToast(message, {
          description: title ? description : undefined,
        });
    }
  };

  return { toast };
}

export { useToast as toast };