const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

const clientCookieOptions = {
    ...cookieOptions,
    httpOnly: false,
};

export const setAuthCookie = (res, token) => {
    res.cookie("token", token, cookieOptions);
    res.cookie("auth_session", "true", clientCookieOptions);
};

export const clearAuthCookie = (res) => {
    const clearOptions = {
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    };
    res.clearCookie("token", { ...clearOptions, httpOnly: true });
    res.clearCookie("auth_session", { ...clearOptions, httpOnly: false });
};

