import jwt from "jsonwebtoken";

export const verifyAuth = (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next();
    } catch (error) {
        console.error(error);

        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};