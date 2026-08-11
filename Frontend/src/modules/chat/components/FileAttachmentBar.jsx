import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import useFileStore from "../stores/useFileStore";
import { FilePreview } from "./FilePreview";
import ImageViewDialog from "./ImageViewDialog";

export function FileAttachmentBar({ onAddMoreFiles }) {
    const { items, retryUpload, cancelItem, setCaption } = useFileStore();

    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerImages, setViewerImages] = useState([]);
    const [viewerIndex, setViewerIndex] = useState(0);

    if (!items || items.length === 0) return null;

    const handleImageClick = (clickedItem) => {
        const imageItems = items.filter((item) => {
            const fileType = item.file?.type || item.attachment?.fileType || "";
            return fileType.startsWith("image/");
        });

        const formattedImages = imageItems.map((item) => {
            let src = "";
            if (item.file) {
                src = URL.createObjectURL(item.file);
            } else if (item.attachment?.url) {
                src = item.attachment.url;
            }
            return {
                src,
                name: item.file?.name || item.attachment?.name || "Image",
            };
        });

        const clickedIdx = imageItems.findIndex((i) => i.id === clickedItem.id);

        if (formattedImages.length > 0) {
            setViewerImages(formattedImages);
            setViewerIndex(clickedIdx >= 0 ? clickedIdx : 0);
            setViewerOpen(true);
        }
    };

    const isUploading = items.some((item) => item.status === "uploading" || item.status === "reconnecting");
    const completedCount = items.filter((item) => item.status === "completed" && item.attachment).length;

    return (
        <div className="w-full bg-slate-50 border-t border-slate-200/80 p-3 z-20 animate-fade-in-up">
            <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">
                        Attachments ({items.length})
                    </span>
                    {isUploading && (
                        <span className="text-[11px] text-blue-600 font-medium animate-pulse">
                            Uploading in background...
                        </span>
                    )}
                    {!isUploading && completedCount > 0 && (
                        <span className="text-[11px] text-emerald-600 font-medium">
                            {completedCount} ready to send
                        </span>
                    )}
                </div>

                {onAddMoreFiles && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={onAddMoreFiles}
                        className="h-7 text-xs gap-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add files
                    </Button>
                )}
            </div>

            {/* Horizontal scrollable or flex wrap list of attached file previews */}
            <div className="flex flex-wrap gap-2.5 max-h-48 overflow-y-auto p-1">
                {items.map((item) => (
                    <div key={item.id} className="w-44 shrink-0">
                        <FilePreview
                            item={item}
                            onImageClick={handleImageClick}
                            onRetry={retryUpload}
                            onCancel={cancelItem}
                            onCaptionChange={setCaption}
                        />
                    </div>
                ))}
            </div>

            {/* Lightbox Image Viewer */}
            <ImageViewDialog
                open={viewerOpen}
                onOpenChange={setViewerOpen}
                images={viewerImages}
                initialIndex={viewerIndex}
            />
        </div>
    );
}

export default FileAttachmentBar;
