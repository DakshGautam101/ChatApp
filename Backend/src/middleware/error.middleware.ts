import { sendError } from "../utils/response.js";
import logger from "../utils/logger.js";
import type { NextFunction, Request, Response } from "express";


export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
    logger.error("Unhandled Error:", { error: err });
   
    let statusCode = 500;
    let message = "Internal server error";

    if (err instanceof Error) {
        message = err.message;

        if ("statusCode" in err && typeof err.statusCode === "number") {
            statusCode = err.statusCode;
        }
    }

    return sendError(res, statusCode, message);
};
