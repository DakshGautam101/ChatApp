import { sendError } from "../utils/response.js";
import logger from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
    logger.error("Unhandled Error:", { error: err.message, stack: err.stack });

    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || "Internal server error";

    return sendError(res, statusCode, message);
};
