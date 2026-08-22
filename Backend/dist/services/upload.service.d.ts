import type { S3File } from "../Interfaces/BacknedInterfaces.js";
export declare const toAttachment: (file: S3File) => {
    url: string;
    key: string;
    fileType: string;
    size: number;
    name: string;
};
export declare const downloadUrlService: (key: string, originalFileName: string) => Promise<string>;
export declare const processAvatarUpload: (file: S3File, userId: string) => Promise<{
    url: string;
    key: string;
    fileType: string;
    size: number;
    name: string;
}>;
export declare const processSingleUpload: (file: S3File, userId: string, uploadId: string) => Promise<{
    url: string;
    key: string;
    fileType: string;
    size: number;
    name: string;
}>;
export declare const registerSessionService: (userId: string, bodyData: any) => Promise<import("mongoose").Document<unknown, {}, import("../Interfaces/BacknedInterfaces.js").UploadSessionInterface, {}, import("mongoose").DefaultSchemaOptions> & import("../Interfaces/BacknedInterfaces.js").UploadSessionInterface & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}>;
export declare const markInterruptedService: (uploadId: string) => Promise<void>;
export declare const getUploadSessionStatusService: (uploadId: string, userId: string) => Promise<import("mongoose").Document<unknown, {}, import("../Interfaces/BacknedInterfaces.js").UploadSessionInterface, {}, import("mongoose").DefaultSchemaOptions> & import("../Interfaces/BacknedInterfaces.js").UploadSessionInterface & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}>;
//# sourceMappingURL=upload.service.d.ts.map