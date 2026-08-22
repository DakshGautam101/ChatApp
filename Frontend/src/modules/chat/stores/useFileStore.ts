import { create } from "zustand";
import { toast } from "react-hot-toast";
import { uploadFileRecoverable } from "@/core/utils/uploadManager";
import useChatStore from "./useChatStore";
import type { AttachmentInterface } from "@/core/types/AttachmentInterface";

const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "video/mp4",
];
const MAX_SIZE = 25 * 1024 * 1024;
const MAX_FILES = 10;


export interface item{
    _id ?: string;
    id : string;
    file ?: File;
    caption ?: string;
    status ?: string;
    progress ?: number;
    attachment ?: AttachmentInterface | null;
    cancel ?: (() => void) | null;
    uploadId ?: string | null;
    messageId ?: string;
}

interface FileStoreInterface{
    items : item[];
    ALLOWED_TYPES: string[];
    MAX_SIZE: number;
    MAX_FILES: number;
    updateItem: (id: string, patch: Partial<item>) => void;
    addFiles: (files: File[]) => void;
    setCaption: (id: string, caption: string) => void;
    startUpload: (item: item, options?: { existingUploadId?: string }) => void;
    activeMessageUploads: Map<string, { content: string; items: item[] }>;
    sendItemsAsOptimisticMessage: ({ messageId, content }: { messageId: string; content?: string }) => any[];
    checkAndEmitMessage: (messageId: string) => void;
    retryUpload: (item: item | AttachmentInterface) => void;
    cancelItem: (id: string) => void;
    reset: () => void;
    removeCompletedItems: () => void;
    getCompletedAttachments: () => any[];
}

const useFileStore = create<FileStoreInterface>((set, get) => ({
    items: [],
    ALLOWED_TYPES,
    MAX_SIZE,
    MAX_FILES,

    updateItem: (id, patch) => {
        set((state) => ({
            items: state.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        }));
    },

    addFiles: (files) => {
        const fileList = Array.from(files || []);
        if (!fileList.length) return;

        const currentItems = get().items;
        if (currentItems.length + fileList.length > MAX_FILES) {
            toast.error(`Maximum ${MAX_FILES} files allowed.`);
            return;
        }

        for (const file of fileList) {
            if (!ALLOWED_TYPES.includes(file.type)) {
                toast.error(`${file.name} is not supported.`);
                return;
            }
            if (file.size > MAX_SIZE) {
                toast.error(`${file.name} exceeds 25 MB.`);
                return;
            }
        }

        const newItems = fileList.map((file) => ({
            id: `${file.name}-${file.lastModified}-${Math.random()}`,
            file,
            caption: "",
            status: "idle",
            progress: 0,
            attachment: null,
            cancel: null,
            uploadId: null,
        }));

        set((state) => ({ items: [...state.items, ...newItems] }));

        newItems.forEach((item) => {
            get().startUpload(item);
        });
    },

    setCaption: (id, caption) => {
        set((state) => ({
            items: state.items.map((item) => (item.id === id ? { ...item, caption } : item)),
        }));
    },

    startUpload: (item, { existingUploadId } = {}) => {
        if (!item.file || !item.id) return { uploadId: null, cancel: null };
        const activeConversation = useChatStore.getState().activeConversation;
        const { updateItem } = get();

        const { uploadId, promise, cancel } = uploadFileRecoverable(item.file, {
            conversationId: activeConversation?._id,
            existingUploadId,
            onStatusChange: (status) => {
                updateItem(item.id, { status });
                const currentItem = get().items.find((i) => i.id === item.id) || item;
                if (currentItem.messageId) {
                    useChatStore.getState().updateOptimisticAttachment(currentItem.messageId, item.id, { status });
                }
            },
            onProgress: (progress) => {
                updateItem(item.id, { progress });
                const currentItem = get().items.find((i) => i.id === item.id) || item;
                if (currentItem.messageId) {
                    useChatStore.getState().updateOptimisticAttachment(currentItem.messageId, item.id, { progress });
                }
            },
        });

        updateItem(item.id, { uploadId, cancel, status: "uploading", progress: 0 });

        promise
            .then((attachment) => {
                const currentItem = get().items.find((i) => i.id === item.id) || item;
                const finalCaption = currentItem?.caption || item.caption || "";
                const completedAtt = { ...attachment, caption: finalCaption };

                updateItem(item.id, {
                    status: "completed",
                    attachment: completedAtt,
                });

                if (currentItem.messageId) {
                    useChatStore.getState().updateOptimisticAttachment(currentItem.messageId, item.id, {
                        status: "completed",
                        url: attachment.url,
                        fileType: attachment.fileType || item.file?.type,
                        name: attachment.name || item.file?.name,
                    });

                    // Check if all attachments for this message are complete
                    get().checkAndEmitMessage(currentItem.messageId);
                }
            })
            .catch((err) => {
                if (err?.message !== "aborted" && err?.message !== "cancelled") {
                    updateItem(item.id, { status: "failed" });
                    const currentItem = get().items.find((i) => i.id === item.id) || item;
                    if (currentItem.messageId) {
                        useChatStore.getState().updateOptimisticAttachment(currentItem.messageId, item.id, { status: "failed" });
                    }
                }
            });

        return { uploadId, cancel };
    },

    activeMessageUploads: new Map(),

    sendItemsAsOptimisticMessage: ({ messageId, content = "" }) => {
        const { items } = get();
        if (!items.length) return [];

        const currentItems = [...items];

        get().activeMessageUploads.set(messageId, {
            content,
            items: currentItems,
        });

        currentItems.forEach((item) => {
            get().updateItem(item.id, { messageId, caption: item.caption || content });
        });

        const attachments = currentItems.map((item) => ({
            id: item.id,
            messageId,
            uploadId: item.uploadId,
            file: item.file,
            name: item.file?.name || item.attachment?.name || "File",
            fileType: item.file?.type || item.attachment?.fileType || "",
            size: item.file?.size || item.attachment?.size,
            url: item.file
                ? (item.file.type.startsWith("image/") || item.file.type.startsWith("video/")
                    ? URL.createObjectURL(item.file)
                    : "")
                : (item.attachment?.url || ""),
            status: item.status,
            progress: item.progress,
            caption: item.caption || content,
        }));

        set({ items: [] });

        setTimeout(() => {
            get().checkAndEmitMessage(messageId);
        }, 50);

        return attachments;
    },

    checkAndEmitMessage: (messageId) => {
        const activeUpload = get().activeMessageUploads.get(messageId);
        if (!activeUpload) return;

        const { items, content } = activeUpload;
        const currentStoreItems = get().items.filter((i) => i.messageId === messageId);
        const allTargetItems = currentStoreItems.length ? currentStoreItems : items;

        const allCompleted = allTargetItems.every((i) => i.status === "completed" && i.attachment);
        if (allCompleted) {
            const completedAttachments = allTargetItems
                .map((i) => i.attachment)
                .filter((att): att is AttachmentInterface => Boolean(att));

            useChatStore.getState().sendMessage({
                content,
                attachments: completedAttachments,
                _tempId: messageId,
            });
            get().activeMessageUploads.delete(messageId);
        }
    },

    retryUpload: (item: item | AttachmentInterface) => {
        let storeItem = get().items.find(
            (i) => (item.id && i.id === item.id) || (item.uploadId && i.uploadId === item.uploadId) || (item._id && i.id === item._id)
        );

        if (!storeItem && get().activeMessageUploads) {
            for (const [mId, activeUpload] of get().activeMessageUploads.entries()) {
                const found = activeUpload.items?.find(
                    (i) => (item.id && i.id === item.id) || (item.uploadId && i.uploadId === item.uploadId) || (item._id && i.id === item._id)
                );
                if (found) {
                    storeItem = { ...found, messageId: mId };
                    break;
                }
            }
        }

        const target = storeItem || item;
        const messageId = target.messageId || item.messageId;
        const itemId = target.id || item.id || item._id;
        if (!itemId) return;

        if (messageId) {
            useChatStore.getState().updateOptimisticAttachment(messageId, itemId, {
                status: "uploading",
                progress: 0,
            });
        }

        if (target.file) {
            const { uploadId, promise, cancel } = uploadFileRecoverable(target.file, {
                conversationId: useChatStore.getState().activeConversation?._id,
                existingUploadId: target.uploadId || undefined,
                onStatusChange: (status) => {
                    get().updateItem(itemId, { status });
                    if (messageId) {
                        useChatStore.getState().updateOptimisticAttachment(messageId, itemId, { status });
                    }
                },
                onProgress: (progress) => {
                    get().updateItem(itemId, { progress });
                    if (messageId) {
                        useChatStore.getState().updateOptimisticAttachment(messageId, itemId, { progress });
                    }
                },
            });

            get().updateItem(itemId, { uploadId, cancel, status: "uploading", progress: 0 });

            promise
                .then((result) => {
                    const finalAttachment = { ...result, caption: target.caption || "" };
                    get().updateItem(itemId, { status: "completed", attachment: finalAttachment });
                    if (messageId) {
                        useChatStore.getState().updateOptimisticAttachment(messageId, itemId, {
                            status: "completed",
                            url: result.url,
                        });
                        get().checkAndEmitMessage(messageId);
                    }
                })
                .catch((err) => {
                    if (err?.message !== "aborted" && err?.message !== "cancelled") {
                        get().updateItem(itemId, { status: "failed" });
                        if (messageId) {
                            useChatStore.getState().updateOptimisticAttachment(messageId, itemId, { status: "failed" });
                        }
                    }
                });
        } else if (target.file && target.id) {
            get().startUpload(target as item, { existingUploadId: target.uploadId || undefined });
        }
    },

    cancelItem: (id) => {
        const item = get().items.find((i) => i.id === id);
        if (item) {
            item.cancel?.();
            set((state) => ({
                items: state.items.filter((i) => i.id !== id),
            }));
        }
    },

    reset: () => {
        const { items } = get();
        items.forEach((item) => item.cancel?.());
        set({ items: [] });
    },

    removeCompletedItems: () => {
        set((state) => ({
            items: state.items.filter((item) => item.status !== "completed"),
        }));
    },

    getCompletedAttachments: () => {
        return get()
            .items.filter((item) => item.status === "completed" && item.attachment)
            .map((item) => {
                const caption = item.caption || item.attachment?.caption || "";
                return { ...item.attachment, caption };
            });
    },
}));

export default useFileStore;