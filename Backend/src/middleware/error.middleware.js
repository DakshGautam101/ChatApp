import { sendError } from "../utils/response.js";

export const errorHandler = (err, req, res, next) => {
    console.error("Unhandled Error:", err.stack || err);

    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || "Internal server error";

    return sendError(res, statusCode, message);
};
