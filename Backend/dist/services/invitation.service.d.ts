export declare const sendInvitationService: (senderId: any, receiverId: any) => Promise<{
    invitation: import("mongoose").Document<unknown, {}, import("../models/invitation.model.js").Invitation, {}, import("mongoose").DefaultSchemaOptions> & import("../models/invitation.model.js").Invitation & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    };
    statusCode: number;
}>;
export declare const changeInvitationStatusService: (invitationId: any, receiverId: any, statusInput: any) => Promise<import("mongoose").Document<unknown, {}, import("../models/invitation.model.js").Invitation, {}, import("mongoose").DefaultSchemaOptions> & import("../models/invitation.model.js").Invitation & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}>;
export declare const getUserInvitationsService: (userId: any) => Promise<{
    received: (import("../models/invitation.model.js").Invitation & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    })[];
    sent: (import("../models/invitation.model.js").Invitation & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    })[];
}>;
//# sourceMappingURL=invitation.service.d.ts.map