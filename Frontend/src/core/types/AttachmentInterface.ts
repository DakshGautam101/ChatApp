export interface AttachmentInterface {
    id?: string;
    _id?: string;
    uploadId?: string;
    url: string;
    type?: string;
    fileType?: string;
    name?: string;
    originalName?: string;
    size?: number;
    caption?: string;
    mimeType?: string;
    progress?: number;
    status?: "uploading" | "completed" | "failed" | string;
    error?: string;
}
