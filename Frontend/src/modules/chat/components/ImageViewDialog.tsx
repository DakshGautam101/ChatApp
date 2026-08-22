import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";

export interface ImageViewerItem {
    src?: string;
    name?: string;
    url?: string;
    alt?: string;
}

interface ImageViewDialogProps {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    images?: (ImageViewerItem | string)[];
    initialIndex?: number;
}

export function ImageViewDialog({ open, onOpenChange, images = [], initialIndex = 0 }: ImageViewDialogProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    useEffect(() => {
        if (open) {
            setCurrentIndex(initialIndex);
        }
    }, [open, initialIndex]);

    const activeImage = images[currentIndex] || (typeof images[0] === "string" ? { src: images[0] } : (images[0] as ImageViewerItem | undefined) || null);

    const getImageSrc = (img: ImageViewerItem | string | null | undefined) => {
        if (!img) return "";
        if (typeof img === "string") return img;
        return img.src || img.url || "";
    };

    const getImageName = (img: ImageViewerItem | string | null | undefined) => {
        if (!img) return "Image";
        if (typeof img === "string") return "Image";
        return img.name || img.alt || "Image";
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    };

    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") {
                setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
            }
            if (e.key === "ArrowRight") {
                setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
            }
            if (e.key === "Escape") onOpenChange?.(false);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, images.length, onOpenChange]);

    if (!activeImage) return null;

    const currentSrc = getImageSrc(activeImage);
    const currentName = getImageName(activeImage);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl border-none bg-slate-950/95 text-white p-0 gap-0 overflow-hidden shadow-2xl">
                <DialogHeader className="flex flex-row items-center justify-between p-4 border-b border-white/10 z-10 bg-slate-900/80 backdrop-blur-sm">
                    <DialogTitle className="text-sm font-medium truncate text-slate-200">
                        {currentName} {images.length > 1 && `(${currentIndex + 1} of ${images.length})`}
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                        {currentSrc && (
                            <a
                                href={currentSrc}
                                download={currentName}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex"
                            >
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-300 hover:text-white hover:bg-white/10">
                                    <Download className="h-4 w-4" />
                                </Button>
                            </a>
                        )}
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-300 hover:text-white hover:bg-white/10"
                            onClick={() => onOpenChange?.(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="relative flex items-center justify-center min-h-[400px] max-h-[80vh] p-4 bg-black/40">
                    {images.length > 1 && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute left-3 z-10 h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/80"
                            onClick={handlePrev}
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                    )}

                    <img
                        src={currentSrc}
                        alt={currentName}
                        className="max-h-[75vh] w-auto max-w-full object-contain rounded select-none animate-fade-in"
                    />

                    {images.length > 1 && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute right-3 z-10 h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/80"
                            onClick={handleNext}
                        >
                            <ChevronRight className="h-6 w-6" />
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default ImageViewDialog;
