import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        // Centralized place to log to a monitoring service later.
        console.error("Unhandled UI error:", error, info);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center animate-in fade-in duration-500">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-secondary">
                    <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                    <h1 className="text-lg font-semibold">Something went wrong</h1>
                    <p className="max-w-sm text-sm text-muted-foreground">
                        The app hit an unexpected error. Reloading usually fixes it.
                    </p>
                </div>
                <Button onClick={this.handleReset} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Reload app
                </Button>
            </div>
        );
    }
}