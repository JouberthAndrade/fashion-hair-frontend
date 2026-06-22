import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Catches render-time errors anywhere below it so a single broken subtree
 * doesn't take down the whole app. Also a safety net for the classic
 * `removeChild` errors triggered by browser translation extensions mutating
 * React-managed DOM nodes.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[FashionHair ErrorBoundary]', error, info);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Algo deu errado
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ocorreu um erro inesperado. Você pode tentar novamente ou recarregar a página.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={this.handleReset}>Tentar novamente</Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Recarregar página
          </Button>
        </div>
      </div>
    );
  }
}
