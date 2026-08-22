const LoadingComponent = () => {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4 animate-scale-in">
                    <div className="relative">
                        <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center animate-float">
                            <span className="loading loading-spinner text-primary loading-md"></span>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">Checking session…</p>
                </div>
            </div>
    )
}   

export default LoadingComponent;