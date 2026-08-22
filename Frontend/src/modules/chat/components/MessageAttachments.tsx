import { Download, FileText, FileVideo, Loader2, RotateCw, WifiOff } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { cn } from "@/core/utils/utils";
import type { AttachmentInterface } from "@/core/types/AttachmentInterface";
import type { MessageBubbleProps } from "./MessageBubble";

export function MessageAttachments({ attachments, message, isMine, onImageClick, onRetry } : MessageBubbleProps & {attachments:AttachmentInterface[]}) {
    if (!attachments || attachments.length === 0) return null;

    const imageAttachments = attachments.filter((att) => att.fileType?.startsWith("image/"));

    return (
        <div className={cn("flex flex-col gap-2", isMine ? "items-end" : "items-start")}>
            {attachments.map((attachment : AttachmentInterface, idx : number) => {
                const isImage = attachment.fileType?.startsWith("image/");
                const isVideo = attachment.fileType?.startsWith("video/");
                const isPdf = attachment.fileType === "application/pdf";
                const status = attachment.status || "completed";
                const progress = attachment.progress || 0;
                const fileUrl = attachment.url?.startsWith("http") || attachment.url?.startsWith("blob:")
                    ? attachment.url
                    : attachment.url
                        ? new URL(attachment.url, import.meta.env.VITE_API_URL || "http://localhost:5000").toString()
                        : "";

                const captionText = attachment.caption || (attachments.length === 1 && message?.content ? message.content : "");
                const formattedSize = attachment.size ? (attachment.size / (1024 * 1024)).toFixed(2) + " MB" : "";

                if (isImage) {
                    const imgIndex = imageAttachments.findIndex((att : AttachmentInterface) => att === attachment);

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

                                {/* Status Overlays for Image */}
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
                        <div key={idx} className="group relative flex flex-col max-w-[260px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="relative w-full bg-black">
                                {fileUrl ? (
                                    <video
                                        src={fileUrl}
                                        controls={status === "completed" || !status}
                                        className="max-h-64 w-full"
                                    />
                                ) : (
                                    <div className="flex h-44 w-full items-center justify-center bg-slate-900 text-slate-400">
                                        <FileVideo className="h-10 w-10" />
                                    </div>
                                )}

                                {/* Status Overlays for Video */}
                                {status === "uploading" && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs">
                                        <div className="relative flex items-center justify-center">
                                            <Loader2 className="h-9 w-9 animate-spin text-white" />
                                            <span className="absolute text-[10px] font-bold text-white">
                                                {progress}%
                                            </span>
                                        </div>
                                        <span className="mt-1 text-[11px] font-medium text-white">Uploading video...</span>
                                    </div>
                                )}

                                {status === "reconnecting" && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-xs p-2 text-center">
                                        <WifiOff className="h-6 w-6 animate-pulse text-amber-400" />
                                        <span className="mt-1 text-[11px] font-semibold text-amber-300">Reconnecting...</span>
                                        {onRetry && (
                                            <Button
                                                type="button"
                                                size="xs"
                                                variant="secondary"
                                                className="mt-2 h-6 px-2.5 text-[10px] gap-1 bg-amber-500 hover:bg-amber-600 text-white border-none cursor-pointer"
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
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 p-2 backdrop-blur-xs">
                                        <span className="text-xs font-semibold text-rose-400">Video Upload Failed</span>
                                        {onRetry && (
                                            <Button
                                                type="button"
                                                size="xs"
                                                variant="secondary"
                                                className="mt-2 h-7 px-3 gap-1 bg-white/20 text-white hover:bg-white/30 border-none text-xs cursor-pointer"
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
                            </div>

                            {captionText && (
                                <div className="px-3 py-2 text-xs font-normal text-slate-800 break-words leading-relaxed">
                                    {captionText}
                                </div>
                            )}
                        </div>
                    );
                }

                {/* Generic Documents / PDFs / Audio / Other files */}
                return (
                    <div key={idx} className="flex flex-col max-w-[280px] w-full">
                        <div
                            className={cn(
                                "flex flex-col rounded-2xl border p-3 shadow-xs transition-all w-full",
                                isMine
                                    ? "bg-blue-600 border-blue-500 text-white"
                                    : "bg-white border-slate-200 text-slate-800"
                            )}
                        >
                            <div className="flex items-center gap-2.5">
                                <div className={cn(
                                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold",
                                    isMine ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600"
                                )}>
                                    {isPdf ? <FileText className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-semibold">{attachment.name || "File"}</p>
                                    {formattedSize && (
                                        <p className={cn("text-[10px]", isMine ? "text-blue-100" : "text-slate-400")}>
                                            {formattedSize}
                                        </p>
                                    )}
                                </div>

                                {status === "completed" || !status ? (
                                    fileUrl ? (
                                        <a
                                            href={fileUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            download
                                            className={cn(
                                                "p-1.5 rounded-lg shrink-0 transition-colors",
                                                isMine ? "hover:bg-white/20 text-white" : "hover:bg-slate-100 text-slate-600"
                                            )}
                                            title="Download file"
                                        >
                                            <Download className="h-4 w-4" />
                                        </a>
                                    ) : null
                                ) : null}
                            </div>

                            {/* Status Indicators for Generic Files */}
                            {status === "uploading" && (
                                <div className="mt-2.5 space-y-1">
                                    <div className="flex items-center justify-between text-[10px] font-semibold">
                                        <span className="flex items-center gap-1">
                                            <Loader2 className="h-3 w-3 animate-spin" /> Uploading...
                                        </span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className={cn("h-1.5 w-full overflow-hidden rounded-full", isMine ? "bg-white/30" : "bg-slate-100")}>
                                        <div
                                            className={cn("h-full transition-all duration-200 rounded-full", isMine ? "bg-white" : "bg-blue-600")}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {status === "reconnecting" && (
                                <div className="mt-2 flex items-center justify-between gap-2 pt-1 border-t border-white/20">
                                    <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-300">
                                        <WifiOff className="h-3.5 w-3.5 animate-pulse" /> Reconnecting...
                                    </span>
                                    {onRetry && (
                                        <Button
                                            type="button"
                                            size="xs"
                                            variant="secondary"
                                            className="h-6 px-2 text-[10px] gap-1 bg-amber-500 hover:bg-amber-600 text-white border-none cursor-pointer"
                                            onClick={() => onRetry(attachment)}
                                        >
                                            <RotateCw className="h-3 w-3" /> Retry
                                        </Button>
                                    )}
                                </div>
                            )}

                            {status === "failed" && (
                                <div className="mt-2 flex items-center justify-between gap-2 pt-1 border-t border-white/20">
                                    <span className={cn("text-[11px] font-semibold", isMine ? "text-rose-200" : "text-rose-600")}>
                                        Upload Failed
                                    </span>
                                    {onRetry && (
                                        <Button
                                            type="button"
                                            size="xs"
                                            variant="secondary"
                                            className={cn(
                                                "h-6 px-2 text-[10px] gap-1 border-none cursor-pointer",
                                                isMine ? "bg-white/20 text-white hover:bg-white/30" : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                                            )}
                                            onClick={() => onRetry(attachment)}
                                        >
                                            <RotateCw className="h-3 w-3" /> Retry
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {captionText && (
                            <p className={cn("mt-1 text-xs px-2 break-words", isMine ? "text-slate-600" : "text-slate-600")}>
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

