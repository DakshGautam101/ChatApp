import { useEffect, useState } from "react";
import { Check, FileText, FileVideo, Loader2, RotateCw, WifiOff, X } from "lucide-react";
import { Button } from "@/core/components/ui/button";

export function FilePreview({ item, onImageClick, onRetry, onCancel, onCaptionChange }) {
    const [previewUrl, setPreviewUrl] = useState(null);

    const file = item?.file;
    const attachment = item?.attachment;
    const status = item?.status || "idle";
    const progress = item?.progress || 0;

    const fileType = file?.type || attachment?.fileType || "";
    const fileName = file?.name || attachment?.name || "File";
    const fileSize = file?.size || attachment?.size;

    const isImage = fileType.startsWith("image/");
    const isVideo = fileType.startsWith("video/");
    const isPdf = fileType === "application/pdf";

    useEffect(() => {
        if (file && isImage) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else if (attachment?.url && isImage) {
            setPreviewUrl(attachment.url);
        }
    }, [file, attachment, isImage]);

    const formattedSize = fileSize ? (fileSize / (1024 * 1024)).toFixed(2) + " MB" : "";

    return (
        <div className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-900/5 transition-all hover:shadow-md">
            {/* Image Preview Container */}
            {isImage ? (
                <div
                    className="relative aspect-square w-full cursor-pointer overflow-hidden bg-slate-950/80"
                    onClick={() => onImageClick?.(item)}
                >
                    {previewUrl ? (
                        <img
                            src={previewUrl}
                            alt={fileName}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-800 text-slate-400">
                            <FileText className="h-8 w-8" />
                        </div>
                    )}

                    {/* Status Overlay for Images */}
                    {status === "uploading" && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-xs">
                            <div className="relative flex items-center justify-center">
                                <Loader2 className="h-9 w-9 animate-spin text-white" />
                                <span className="absolute text-[10px] font-bold text-white">
                                    {progress}%
                                </span>
                            </div>
                            <span className="mt-1 text-[11px] font-medium text-white/90">Uploading...</span>
                        </div>
                    )}

                    {status === "reconnecting" && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs p-2 text-center">
                            <WifiOff className="h-5 w-5 animate-pulse text-amber-400" />
                            <span className="mt-1 text-[11px] font-semibold text-amber-300">Reconnecting...</span>
                            {onRetry && (
                                <Button
                                    type="button"
                                    size="xs"
                                    variant="secondary"
                                    className="mt-1.5 h-6 px-2 text-[10px] gap-1 bg-amber-500 hover:bg-amber-600 text-white border-none cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRetry(item);
                                    }}
                                >
                                    <RotateCw className="h-3 w-3" /> Retry
                                </Button>
                            )}
                        </div>
                    )}

                    {status === "failed" && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/65 p-2 backdrop-blur-xs">
                            <span className="flex items-center gap-1 text-xs font-semibold text-rose-400">
                                <X className="h-4 w-4" /> Upload Failed
                            </span>
                            {onRetry && (
                                <Button
                                    type="button"
                                    size="xs"
                                    variant="secondary"
                                    className="mt-2 h-7 gap-1 bg-white/20 text-white hover:bg-white/30 border-none text-xs cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRetry(item);
                                    }}
                                >
                                    <RotateCw className="h-3 w-3" /> Retry
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Single Tick Badge for Completed Images */}
                    {status === "completed" && (
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-emerald-600/90 px-2 py-0.5 text-[10px] font-medium text-white shadow-sm backdrop-blur-xs">
                            <Check className="h-3 w-3" />
                            <span>Uploaded</span>
                        </div>
                    )}
                </div>
            ) : (
                /* Non-Image Card Container (PDF, Video, Docs) */
                <div className="flex items-center gap-3 p-3 bg-white">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        {isVideo ? (
                            <FileVideo className="h-6 w-6" />
                        ) : isPdf ? (
                            <FileText className="h-6 w-6 text-rose-500" />
                        ) : (
                            <FileText className="h-6 w-6" />
                        )}
                    </div>

                    <div className="flex flex-1 flex-col min-w-0">
                        <span className="truncate text-xs font-semibold text-slate-800">{fileName}</span>
                        <span className="text-[11px] text-slate-400">{formattedSize}</span>

                        {status === "uploading" && (
                            <div className="mt-1.5 flex items-center gap-2">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className="h-full bg-blue-600 transition-all duration-200"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <span className="text-[10px] font-medium text-slate-500">{progress}%</span>
                            </div>
                        )}

                        {status === "reconnecting" && (
                            <div className="mt-1 flex items-center justify-between gap-1">
                                <span className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                                    <WifiOff className="h-3 w-3 animate-pulse" /> Reconnecting...
                                </span>
                                {onRetry && (
                                    <Button
                                        type="button"
                                        size="xs"
                                        variant="outline"
                                        className="h-5 px-1.5 text-[10px] gap-1 border-amber-300 text-amber-700 hover:bg-amber-50 cursor-pointer"
                                        onClick={() => onRetry(item)}
                                    >
                                        <RotateCw className="h-2.5 w-2.5" /> Retry
                                    </Button>
                                )}
                            </div>
                        )}

                        {status === "failed" && (
                            <div className="mt-1 flex items-center justify-between gap-1">
                                <span className="text-[11px] text-rose-500 font-medium">Failed</span>
                                {onRetry && (
                                    <Button
                                        type="button"
                                        size="xs"
                                        variant="outline"
                                        className="h-6 px-2 text-[10px] gap-1 border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                                        onClick={() => onRetry(item)}
                                    >
                                        <RotateCw className="h-2.5 w-2.5" /> Retry
                                    </Button>
                                )}
                            </div>
                        )}

                        {status === "completed" && (
                            <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                                <Check className="h-3.5 w-3.5" /> Uploaded
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Optional Per-File Caption Input */}
            {onCaptionChange && (
                <div className="p-1.5 bg-white border-t border-slate-200">
                    <input
                        type="text"
                        placeholder="Add a caption..."
                        value={item.caption || ""}
                        onChange={(e) => onCaptionChange(item.id, e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            )}

            {onCancel && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onCancel(item.id);
                    }}
                    className="absolute top-1.5 right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    );
}

export default FilePreview;