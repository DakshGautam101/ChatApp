import { Types } from "mongoose";
import type { SendInvitationResult, UserInvitationsResult } from "../Interfaces/BacknedInterfaces.js";
export declare const sendInvitationService: (senderId: string | Types.ObjectId, receiverId?: string | Types.ObjectId) => Promise<SendInvitationResult>;
export declare const changeInvitationStatusService: (invitationId?: string | Types.ObjectId, receiverId?: string | Types.ObjectId, statusInput?: any) => Promise<import("mongoose").Document<unknown, {}, import("../Interfaces/BacknedInterfaces.js").InvitationInterface, {}, import("mongoose").DefaultSchemaOptions> & import("../Interfaces/BacknedInterfaces.js").InvitationInterface & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}>;
export declare const getUserInvitationsService: (userId: string | Types.ObjectId) => Promise<UserInvitationsResult>;
//# sourceMappingURL=invitation.service.d.ts.map