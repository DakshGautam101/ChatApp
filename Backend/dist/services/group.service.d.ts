import { Types } from "mongoose";
import type { CreateGroupParams, KickMemberParams, LeaveGroupParams, LeaveOrKickResult, RespondToGroupInvitationParams, SearchUsersForGroupParams, SendGroupInvitationParams, UpdateGroupAvatarParams, UpdateMemberRoleParams, UserInterface } from "../Interfaces/BacknedInterfaces.js";
import type { ConversationInterface } from "../Interfaces/BacknedInterfaces.js";
import type { GroupInvitationInterface } from "../Interfaces/BacknedInterfaces.js";
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