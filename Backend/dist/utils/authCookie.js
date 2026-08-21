const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
};
export const setAuthCookie = (res, token) => {
    res.cookie("token", token, cookieOptions);
};
export const clearAuthCookie = (res) => {
    res.cookie("token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        expires: new Date(0),
        maxAge: 0,
    });
};
//# sourceMappingURL=authCookie.js.map