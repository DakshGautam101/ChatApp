import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/core/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/core/components/ui/dialog";
import { Input } from "@/core/components/ui/input";
import { FileInputIcon } from "lucide-react";
import useChatStore from "../stores/useChatStore";
import useFileStore, { type item } from "../stores/useFileStore";
import { FilePreview } from "./FilePreview";
import { ImageViewDialog } from "./ImageViewDialog";

interface FileInputDialogProps {
    openFileDialog: boolean;
    setOpenFileDialog: (open: boolean) => void;
}

export function FileInputDialog({ openFileDialog, setOpenFileDialog }: FileInputDialogProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { sendMessage } = useChatStore();
    const { items, addFiles, retryUpload, cancelItem, reset, getCompletedAttachments, setCaption } = useFileStore();

    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerImages, setViewerImages] = useState<Array<{ src: string; name: string }>>([]);
    const [viewerIndex, setViewerIndex] = useState(0);

    useEffect(() => {
        if (!openFileDialog) {
            reset();
            setViewerOpen(false);
        }
    }, [openFileDialog, reset]);

    const handleFileChange = (e : React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            addFiles(files);
        }   
        e.target.value = "";
    };

    const handleImageClick = (clickedItem : item) => {
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

    const allCompleted = items.length > 0 && items.every((item) => item.status === "completed");
    const anyFailed = items.some((item) => item.status === "failed");
    const isBusy = items.some((item) => item.status === "uploading" || item.status === "reconnecting");

    const handleSend = () => {
        const attachments = getCompletedAttachments();

        if (!attachments.length) return;

        sendMessage({ attachments });
        reset();
        setOpenFileDialog(false);
        toast.success(attachments.length > 1 ? "Files sent" : "File sent");
    };

    return (
        <>
            <Dialog open={openFileDialog} onOpenChange={setOpenFileDialog}>
                <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-5 gap-4 overflow-hidden">
                    <DialogHeader className="justify-center items-center gap-1.5 text-center">
                        <DialogTitle className="font-semibold text-lg">Send Files</DialogTitle>
                        <DialogDescription className="font-normal text-xs text-muted-foreground">
                            Maximum 10 files allowed • Limit: 25 MB per file
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col items-center justify-center gap-3 w-full overflow-y-auto pr-1">
                        <Input
                            type="file"
                            ref={fileInputRef}
                            multiple
                            className="hidden"
                            accept="image/jpeg,image/png,image/gif,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,video/mp4"
                            onChange={handleFileChange}
                        />

                        <Button
                            className="border-blue-600 flex justify-center items-center h-10 w-full sm:w-auto px-6"
                            onClick={() => fileInputRef.current?.click()}
                            type="button"
                            variant="outline"
                        >
                            <FileInputIcon className="mr-2 h-4 w-4 text-blue-600" />
                            Choose Files
                        </Button>

                        {/* WhatsApp Style Items Preview Grid */}
                        {items.length > 0 && (
                            <div className="mt-2 w-full grid grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto p-1">
                                {items.map((item) => (
                                    <FilePreview
                                        key={item.id}
                                        item={item}
                                        onImageClick={handleImageClick}
                                        onRetry={retryUpload}
                                        onCancel={cancelItem}
                                        onCaptionChange={setCaption}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={handleSend}
                        disabled={items.length === 0 || !allCompleted || isBusy}
                        type="button"
                        className="w-full mt-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    >
                        {anyFailed ? "Retry failed files to continue" : isBusy ? "Uploading..." : "Send"}
                    </Button>

                    <DialogFooter className="flex items-center justify-center pt-1 border-t text-xs text-muted-foreground">
                        Supported formats: JPG, PNG, GIF, PDF, DOCX, MP4
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Lightbox Image View Dialog */}
            <ImageViewDialog
                open={viewerOpen}
                onOpenChange={setViewerOpen}
                images={viewerImages}
                initialIndex={viewerIndex}
            />
        </>
    );
}

export default FileInputDialog;
