import jwt, {} from "jsonwebtoken";
import logger from "../utils/logger.js";
import User from "../models/user.model.js";
const isAuthTokenPayload = (decoded) => {
    return (typeof decoded !== "string" &&
        typeof decoded.id === "string" &&
        typeof decoded.tokenVersion === "number");
};
export const verifyAuth = async (req, res, next) => {
    try {
        let token = req.cookies?.token;
        if (!token && req.headers.authorization) {
            if (req.headers.authorization.startsWith("Bearer ")) {
                token = req.headers.authorization.split(" ")[1];
            }
            else {
                token = req.headers.authorization;
            }
        }
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized - Token missing",
            });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!isAuthTokenPayload(decoded)) {
            return res.status(401).json({
                success: false,
                message: "Invalid token payload",
            });
        }
        const dbUser = await User.findById(decoded.id).select("tokenVersion isVerified");
        if (!dbUser || (dbUser.tokenVersion ?? 0) !== (decoded.tokenVersion ?? 0)) {
            return res.status(401).json({
                success: false,
                message: "Token has been revoked or expired",
            });
        }
        if (!dbUser.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Account is not verified. Please verify your email before accessing this feature.",
            });
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        if (error instanceof Error) {
            logger.warn("Auth Verification Error:", { error: error.message });
        }
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};
export const optionalAuth = async (req, res, next) => {
    try {
        let token = req.cookies?.token;
        if (!token && req.headers.authorization) {
            if (req.headers.authorization.startsWith("Bearer ")) {
                token = req.headers.authorization.split(" ")[1];
            }
            else {
                token = req.headers.authorization;
            }
        }
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!isAuthTokenPayload(decoded)) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid token payload",
                });
            }
            const dbUser = await User.findById(decoded.id).select("tokenVersion isVerified");
            if (dbUser && (dbUser.tokenVersion ?? 0) === (decoded.tokenVersion ?? 0) && dbUser.isVerified) {
                req.user = decoded;
            }
        }
        next();
    }
    catch (e) {
        next();
    }
};
//# sourceMappingURL=verifyAuth.middleware.js.map