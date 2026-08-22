export interface UserInterface {
    _id?: string;
    id?: string;
    username?: string;
    email: string;
    password?: string;
    avatar?: string;
    phone?: string;
    status?: "online" | "offline" | string;
    isEmailVerified?: boolean;
}
