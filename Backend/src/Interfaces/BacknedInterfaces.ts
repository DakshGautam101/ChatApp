import type { JwtPayload } from "jsonwebtoken";
import type { Types } from "mongoose";

export interface AuthTokenPayload extends JwtPayload {
    id: string;
    tokenVersion?: number;
}
export type LastMessage = {
    text: string,
    sender: Types.ObjectId,
    receiver: Types.ObjectId
}
export interface ConversationInterface {
    type: 'private' | 'group',
    name?: string,
    avatarUrl?: string,
    isConvertedFromGroup?: boolean,
    formerGroupName?: string,
    createdBy?: Types.ObjectId,
    participants: ParticipantInterface[],
    lastMessage: LastMessage | null,
    uploadStatus?: 'pending' | 'completed' | 'failed'
}
export interface ParticipantInterface{
    user: Types.ObjectId | string,
    role: "admin" | "member",
    isOwner?: boolean,
    lastReadMessageId?: Types.ObjectId | null,
    muted?: boolean,
    joinedAt?: Date,
}
export interface GroupInvitationInterface {
    group : Types.ObjectId,
    sender : Types.ObjectId,
    receiver : Types.ObjectId,
    status : "pending" | "accepted" | "rejected"
}
export interface InvitationInterface {
    sender : Types.ObjectId;
    receiver : Types.ObjectId;
    status : "pending" | "accepted" | "rejected";
    rejectedUntil?: Date | null;
}
export interface AttachmentInterface{
    url : string,
    fileType : string,
    size : number,
    name : string
}

export type DeliveredToType = {
    user: Types.ObjectId;
    deliveredAt: Date;
};

export type ReadByType = {
    user: Types.ObjectId;
    readAt: Date;
};

export type ReactionType = {
    user: Types.ObjectId;
    type: string;
};

export interface MessagInterface {
    conversation: Types.ObjectId;
    sender: Types.ObjectId;
    content: string;
    status: 'sent' | 'delivered' | 'read';
    deliveredTo: DeliveredToType[];
    readBy: ReadByType[];
    attachments: AttachmentInterface[];
    reactions: ReactionType[];
    createdAt?: Date;
    updatedAt?: Date;
}

export interface NotificationInterface{
    recipient : Types.ObjectId,
    sender : Types.ObjectId,
    type : 'message' | 'invitation' | 'group_invitation' | 'system' | 'notification',
    title : string | null,
    message : string,
    conversation ?: Types.ObjectId,
    invitation ?: Types.ObjectId,
    isRead : boolean
}
export interface UploadSessionInterface{
    uploadId : string,
    uploader : Types.ObjectId,
    conversation : Types.ObjectId,
    filename : string
    mimetype ?: string | null
    size ?: number
    status : 'uploading'| 'interrupted' | 'completed' | 'failed'
    attempts ?: number
    url ?: string | null
}
export interface UserInterface {
    username: string;
    email: string;
    password?: string;
    phone: string;
    avatar?: string | null;
    status?: "online" | "offline";
    blockedUsers?: Types.ObjectId[];
    friends?: Types.ObjectId[];
    invitations?: Types.ObjectId[];
    isVerified?: boolean;
    isDeleted?: boolean;
    tokenVersion?: number;
} 
export interface CacheItem {
    value: any;
    expiresAt: number | null;
}

export interface CustomError extends Error {
    statusCode?: number;
}

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
export interface S3File {
    location: string;
    key: string;
    mimetype: string;
    size: number;
    originalname: string;
}

export interface SendMessageParams {
    userId: string | Types.ObjectId;
    conversationId: string | Types.ObjectId;
    content?: string;
    attachments?: AttachmentInterface[];
}

export interface SendInvitationResult {
    invitation: any;
    statusCode: number;
}

export interface UserInvitationsResult {
    received: any[];
    sent: any[];
}

export interface GetMessagesResult {
    messages: any[];
    hasMore: boolean;
}
