export declare const fetchUserList: (currentUserId: any) => Promise<{
    _id: import("mongoose").Types.ObjectId;
    __v: number;
    username: string;
    email: string;
    password?: string;
    phone: string;
    avatar?: string | null;
    blockedUsers?: import("mongoose").Types.ObjectId[];
    friends?: import("mongoose").Types.ObjectId[];
    invitations?: import("mongoose").Types.ObjectId[];
    isVerified?: boolean;
    isDeleted?: boolean;
    tokenVersion?: number;
    status: string;
    isFriend: boolean;
}[]>;
//# sourceMappingURL=user.service.d.ts.map