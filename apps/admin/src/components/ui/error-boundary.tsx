import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { Button } from './button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  resetTimeoutId: number | null = null;
  resetKeys: Array<string | number>;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
    this.resetKeys = props.resetKeys || [];
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, componentName } = this.props;

    // Log error to console with component context
    console.error(
      `Error Boundary${componentName ? ` (${componentName})` : ''} caught:`,
      error,
      errorInfo
    );

    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo);
    }

    // Send to error tracking service if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
            componentName: componentName
          }
        }
      });
    }
  }

  componentDidUpdate() {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && resetOnPropsChange) {
      const hasResetKeyChanged = resetKeys?.some(
        (key, index) => key !== this.resetKeys[index]
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
        this.resetKeys = resetKeys || [];
      }
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { fallback, children, isolate, componentName } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return <>{fallback}</>;
      }

      // For isolated errors, show a compact error state
      if (isolate) {
        return (
          <div className="p-4 border border-destructive/50 rounded-md bg-destructive/10">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">
                  Erro ao carregar {componentName || 'componente'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ocorreu um erro inesperado. Por favor, tente novamente.
                </p>
                <Button
                  onClick={this.resetErrorBoundary}
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 text-xs"
                >
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Tentar novamente
                </Button>
              </div>
            </div>
          </div>
        );
      }

      // Default full error display
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <Alert variant="destructive" className="max-w-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              Oops! Algo deu errado
              {componentName && ` em ${componentName}`}
            </AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-4">
                Encontramos um erro inesperado. Você pode tentar recarregar a página
                ou entrar em contato com o suporte se o problema persistir.
              </p>

              {/* Show error details in development */}
              {import.meta.env.DEV && error && (
                <details className="mt-4 p-3 bg-destructive/10 rounded-md">
                  <summary className="cursor-pointer font-semibold text-sm">
                    Detalhes do erro (desenvolvimento)
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto whitespace-pre-wrap">
                    <strong>Erro:</strong> {error.toString()}
                    {error.stack && (
                      <>
                        {'\n\n'}
                        <strong>Stack:</strong>
                        {'\n'}
                        {error.stack}
                      </>
                    )}
                    {errorInfo && (
                      <>
                        {'\n\n'}
                        <strong>Component Stack:</strong>
                        {errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </details>
              )}

              <div className="flex gap-3 mt-4">
                <Button
                  onClick={this.resetErrorBoundary}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tentar novamente
                </Button>

                <Button
                  onClick={() => window.location.reload()}
                  variant="ghost"
                  size="sm"
                >
                  Recarregar página
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return children;
  }
}

/**
 * HOC to wrap a component with an error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook to use with error boundaries
 */
export function useErrorHandler() {
  return (error: Error) => {
    throw error; // This will be caught by the nearest error boundary
  };
}