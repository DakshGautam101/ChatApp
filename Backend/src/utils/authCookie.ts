import type { CookieOptions, Response } from "express";


const cookieOptions : CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax" ,
    maxAge: 7 * 24 * 60 * 60 * 1000,
};


export const setAuthCookie = (res:Response, token:string ) => {
    res.cookie("token", token, cookieOptions);
};

export const clearAuthCookie = (res : Response) => {
    res.cookie("token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        expires: new Date(0),
        maxAge: 0,
    });
};
