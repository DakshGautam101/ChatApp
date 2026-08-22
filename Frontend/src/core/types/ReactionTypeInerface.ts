import type { UserInterface } from "./UserInterface";

export interface ReactionTypeInerface{
    emoji : string
    userId : string;
    user : UserInterface[];
}