export const hasAuthCookie = () => {
    if (typeof document === "undefined") return false;
    return document.cookie.split(";").some((item) => item.trim().startsWith("auth_session="));
};
