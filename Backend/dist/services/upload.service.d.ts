export declare const toAttachment: (file: any) => {
    url: any;
    key: any;
    fileType: any;
    size: any;
    name: any;
};
export declare const downloadUrlService: (key: any, originalFileName: any) => Promise<string>;
export declare const processAvatarUpload: (file: any, userId: any) => Promise<{
    url: any;
    key: any;
    fileType: any;
    size: any;
    name: any;
}>;
export declare const processSingleUpload: (file: any, userId: any, uploadId: any) => Promise<{
    url: any;
    key: any;
    fileType: any;
    size: any;
    name: any;
}>;
export declare const registerSessionService: (userId: any, bodyData: any) => Promise<import("mongoose").Document<unknown, {}, import("../models/uploadSession.model.js").UploadSessionInterface, {}, import("mongoose").DefaultSchemaOptions> & import("../models/uploadSession.model.js").UploadSessionInterface & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}>;
export declare const markInterruptedService: (uploadId: any) => Promise<void>;
export declare const getUploadSessionStatusService: (uploadId: any, userId: any) => Promise<import("mongoose").Document<unknown, {}, import("../models/uploadSession.model.js").UploadSessionInterface, {}, import("mongoose").DefaultSchemaOptions> & import("../models/uploadSession.model.js").UploadSessionInterface & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}>;
//# sourceMappingURL=upload.service.d.ts.map