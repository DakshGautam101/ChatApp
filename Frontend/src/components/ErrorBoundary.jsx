import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen items-center justify-center bg-background p-4">
                    <div className="glass rounded-2xl p-8 text-center max-w-md animate-scale-in">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                            <AlertTriangle className="h-7 w-7 text-foreground" />
                        </div>
                        <h1 className="text-xl font-semibold text-foreground mb-2">
                            Something went wrong
                        </h1>
                        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                            {this.state.error?.message || "An unexpected error occurred"}
                        </p>
                        <button
                            className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-white/20 hover:scale-105 active:scale-95"
                            onClick={() => window.location.reload()}
                        >
                            <RefreshCw className="h-4 w-4" />
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;