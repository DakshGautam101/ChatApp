import { Types } from "mongoose";
import { type ConversationInterface } from "../models/conversation.model.js";
import { type UserInterface } from "../models/user.model.js";
import { type GroupInvitationInterface } from "../models/groupInvitation.model.js";
export interface CreateGroupParams {
    name: string;
    members: string[];
    creatorId: string | Types.ObjectId;
}
export interface SendGroupInvitationParams {
    stringGroupId: string | Types.ObjectId;
    senderId: string | Types.ObjectId;
    receiverId?: string | Types.ObjectId;
    query?: string;
}
export interface RespondToGroupInvitationParams {
    invitationId: string | Types.ObjectId;
    userId: string | Types.ObjectId;
    action: "accepted" | "rejected";
}
export interface SearchUsersForGroupParams {
    groupId: string | Types.ObjectId;
    query?: string;
    currentUserId: string | Types.ObjectId;
}
export interface UpdateGroupAvatarParams {
    groupId: string | Types.ObjectId;
    avatarUrl: string;
    requesterId: string | Types.ObjectId;
}
export interface UpdateMemberRoleParams {
    groupId: string | Types.ObjectId;
    targetUserId: string | Types.ObjectId;
    newRole: "admin" | "member";
    requesterId: string | Types.ObjectId;
}
export interface LeaveGroupParams {
    groupId: string | Types.ObjectId;
    userId: string | Types.ObjectId;
}
export interface KickMemberParams {
    groupId: string | Types.ObjectId;
    targetUserId: string | Types.ObjectId;
    requesterId: string | Types.ObjectId;
}
export interface LeaveOrKickResult {
    status: "disbanded" | "converted_to_private" | "updated";
    disbanded?: boolean;
    convertedToPrivate?: boolean;
    conversation: any;
    remainingMemberIds: string[];
}
export declare const createGroupService: ({ name, members, creatorId }: CreateGroupParams) => Promise<(import("mongoose").Document<unknown, {}, ConversationInterface, {}, import("mongoose").DefaultSchemaOptions> & ConversationInterface & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | null>;
export declare const sendGroupInvitationService: ({ stringGroupId, senderId, receiverId, query }: SendGroupInvitationParams) => Promise<(import("mongoose").Document<unknown, {}, GroupInvitationInterface, {}, import("mongoose").DefaultSchemaOptions> & GroupInvitationInterface & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | null>;
export declare const getPendingGroupInvitationsService: (userId: string | Types.ObjectId) => Promise<(GroupInvitationInterface & {
    _id: Types.ObjectId;
} & {
    __v: number;
})[]>;
export declare const respondToGroupInvitationService: ({ invitationId, userId, action }: RespondToGroupInvitationParams) => Promise<{
    invitation: (import("mongoose").Document<unknown, {}, GroupInvitationInterface, {}, import("mongoose").DefaultSchemaOptions> & GroupInvitationInterface & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }) | null;
    conversation: (import("mongoose").Document<unknown, {}, ConversationInterface, {}, import("mongoose").DefaultSchemaOptions> & ConversationInterface & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }) | null;
}>;
export declare const searchUsersForGroupService: ({ groupId, query, currentUserId }: SearchUsersForGroupParams) => Promise<(UserInterface & {
    _id: Types.ObjectId;
} & {
    __v: number;
})[]>;
export declare const updateGroupAvatarService: ({ groupId, avatarUrl, requesterId }: UpdateGroupAvatarParams) => Promise<(import("mongoose").Document<unknown, {}, ConversationInterface, {}, import("mongoose").DefaultSchemaOptions> & ConversationInterface & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | null>;
export declare const updateMemberRoleService: ({ groupId, targetUserId, newRole, requesterId }: UpdateMemberRoleParams) => Promise<(import("mongoose").Document<unknown, {}, ConversationInterface, {}, import("mongoose").DefaultSchemaOptions> & ConversationInterface & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | null>;
export declare const leaveGroupService: ({ groupId, userId }: LeaveGroupParams) => Promise<LeaveOrKickResult>;
export declare const kickMemberService: ({ groupId, targetUserId, requesterId }: KickMemberParams) => Promise<LeaveOrKickResult>;
//# sourceMappingURL=group.service.d.ts.map