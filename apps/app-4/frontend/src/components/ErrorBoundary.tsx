import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/Button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ error, errorInfo });
        // Log error to an error reporting service
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    handleGoHome = () => {
        window.location.href = '/dashboard';
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-4">
                    <div className="max-w-md w-full text-center space-y-6">
                        <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-destructive" />
                        </div>
                        
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-foreground">
                                Ops! Algo deu errado
                            </h1>
                            <p className="text-muted-foreground">
                                Ocorreu um erro inesperado. Por favor, tente novamente ou volte para a página inicial.
                            </p>
                        </div>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="bg-muted p-4 rounded-lg text-left overflow-auto max-h-48">
                                <p className="text-sm font-mono text-destructive">
                                    {this.state.error.toString()}
                                </p>
                                {this.state.errorInfo && (
                                    <pre className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button onClick={this.handleReset} variant="outline">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Tentar Novamente
                            </Button>
                            <Button onClick={this.handleGoHome}>
                                <Home className="w-4 h-4 mr-2" />
                                Ir para Início
                            </Button>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Se o problema persistir, entre em contato com o suporte.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Hook-based error boundary wrapper for functional components
export function withErrorBoundary<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    fallback?: ReactNode
) {
    return function WithErrorBoundaryWrapper(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <WrappedComponent {...props} />
            </ErrorBoundary>
        );
    };
}
