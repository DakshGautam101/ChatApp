import type { Response } from "express";
import type { UserInterface } from "../Interfaces/BacknedInterfaces.js";
declare const findUserByEmail: (email: string) => Promise<(import("mongoose").Document<unknown, {}, UserInterface, {}, import("mongoose").DefaultSchemaOptions> & UserInterface & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | null>;
declare const checkExistingUser: (email: string) => Promise<boolean>;
declare const checkExistingUserByID: (id: string) => Promise<boolean>;
declare const createUserWithOtp: ({ username, email, phone, password, avatar }: UserInterface) => Promise<import("mongoose").Document<unknown, {}, UserInterface, {}, import("mongoose").DefaultSchemaOptions> & UserInterface & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}>;
declare const issueToken: (user: UserInterface) => string;
declare const attachAuthResponse: (res: Response, user: UserInterface) => string;
declare const createSafeUserResponse: (userId: string) => Promise<(import("mongoose").Document<unknown, {}, UserInterface, {}, import("mongoose").DefaultSchemaOptions> & UserInterface & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | null>;
declare const sendVerificationEmail: (email: string) => Promise<void>;
export { findUserByEmail, checkExistingUser, checkExistingUserByID, createUserWithOtp, issueToken, attachAuthResponse, createSafeUserResponse, sendVerificationEmail, };
//# sourceMappingURL=auth.service.d.ts.map