import type { NextFunction, Request, Response } from "express";
import logger from "../utils/logger.js";

export const requestLogger = (req : Request, res:Response, next:NextFunction) => {
    const start = Date.now();

    res.on("finish", () => {
        const duration = Date.now() - start;
        const message = `${req.method} ${req.originalUrl || req.url} ${res.statusCode} - ${duration}ms`;
        const logData = {
            method: req.method,
            url: req.originalUrl || req.url,
            status: res.statusCode,
            durationMs: duration,
            ip: req.ip || req.socket.remoteAddress,
        };

        if (res.statusCode >= 500) {
            logger.error(message, logData);
        } else if (res.statusCode >= 400) {
            logger.warn(message, logData);
        } else {
            logger.info(message, logData);
        }
    });

    next();
};
