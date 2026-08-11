import { Download, FileText, Loader2, RotateCw, WifiOff } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { cn } from "@/core/utils/utils";

export function MessageAttachments({ attachments, message, isMine, onImageClick, onRetry }) {
    if (!attachments || attachments.length === 0) return null;

    const imageAttachments = attachments.filter((att) => att.fileType?.startsWith("image/"));

    return (
        <div className={cn("flex flex-col gap-2", isMine ? "items-end" : "items-start")}>
            {attachments.map((attachment, idx) => {
                const isImage = attachment.fileType?.startsWith("image/");
                const isVideo = attachment.fileType?.startsWith("video/");
                const status = attachment.status || "completed";
                const progress = attachment.progress || 0;
                const fileUrl = attachment.url?.startsWith("http") || attachment.url?.startsWith("blob:")
                    ? attachment.url
                    : attachment.url
                        ? new URL(attachment.url, import.meta.env.VITE_API_URL || "http://localhost:5000").toString()
                        : "";

                const captionText = attachment.caption || (attachments.length === 1 && message?.content ? message.content : "");

                if (isImage) {
                    const imgIndex = imageAttachments.findIndex((att) => att === attachment);

                    return (
                        <div
                            key={idx}
                            className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 shadow-sm max-w-[260px] bg-white text-left"
                        >
                            <button
                                type="button"
                                onClick={() => onImageClick?.(message, imgIndex >= 0 ? imgIndex : 0)}
                                className="relative block cursor-pointer overflow-hidden w-full hover:opacity-95 transition-opacity"
                            >
                                {fileUrl ? (
                                    <img
                                        src={fileUrl}
                                        alt={attachment.name || "attachment"}
                                        className="max-h-64 w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-44 w-full items-center justify-center bg-slate-100 text-slate-400">
                                        <FileText className="h-8 w-8" />
                                    </div>
                                )}

                                {/* Status Overlays for Image in Chat */}
                                {status === "uploading" && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-xs">
                                        <div className="relative flex items-center justify-center">
                                            <Loader2 className="h-8 w-8 animate-spin text-white" />
                                            <span className="absolute text-[10px] font-bold text-white">
                                                {progress}%
                                            </span>
                                        </div>
                                        <span className="mt-1 text-[11px] font-medium text-white">Uploading...</span>
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
                                                    e.preventDefault();
                                                    onRetry(attachment);
                                                }}
                                            >
                                                <RotateCw className="h-3 w-3" /> Retry
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {status === "failed" && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/65 p-2 backdrop-blur-xs">
                                        <span className="text-xs font-semibold text-rose-400">Upload Failed</span>
                                        {onRetry && (
                                            <Button
                                                type="button"
                                                size="xs"
                                                variant="secondary"
                                                className="mt-2 h-7 gap-1 bg-white/20 text-white hover:bg-white/30 border-none text-xs cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    onRetry(attachment);
                                                }}
                                            >
                                                <RotateCw className="h-3 w-3" /> Retry
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </button>

                            {/* Caption Display */}
                            {captionText && (
                                <div className="px-3 py-2 bg-white text-xs font-normal text-slate-800 break-words leading-relaxed">
                                    {captionText}
                                </div>
                            )}
                        </div>
                    );
                }

                if (isVideo) {
                    return (
                        <div key={idx} className="flex flex-col max-w-[260px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <video
                                src={fileUrl}
                                controls
                                className="max-h-64 w-full"
                            />
                            {captionText && (
                                <div className="px-3 py-2 text-xs font-normal text-slate-800 break-words leading-relaxed">
                                    {captionText}
                                </div>
                            )}
                        </div>
                    );
                }

                return (
                    <div key={idx} className="flex flex-col max-w-[260px]">
                        <a
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className={cn(
                                "flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 shadow-xs w-full",
                                isMine
                                    ? "bg-blue-600 border-transparent text-white"
                                    : "bg-white border-slate-200 text-slate-800"
                            )}
                        >
                            <FileText className="h-4 w-4 shrink-0" />
                            <span className="truncate text-sm font-medium flex-1">{attachment.name || "File"}</span>
                            <Download className="h-3.5 w-3.5 shrink-0 opacity-70" />
                        </a>
                        {captionText && (
                            <p className={cn("mt-1 text-xs px-2 break-words", isMine ? "bg-blue-600 text-slate-200" : "bg-white text-slate-600")}>
                                {captionText}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default MessageAttachments;
