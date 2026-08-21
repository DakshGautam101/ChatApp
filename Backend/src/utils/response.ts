import type { Response } from "express";

export const sendError = (res : Response, status:number, message:string) => res.status(status).json({ success: false, message });

export const sendSuccess = (res: Response, status: number, data: any = {}, message?: string) => {
    const payload = { success: true, ...(message ? { message } : {}) };
    if (Array.isArray(data)) {
        return res.status(status).json({ ...payload, data });
    }
    if (data && typeof data === "object") {
        return res.status(status).json({ ...payload, ...data });
    }
    return res.status(status).json({ ...payload, data });
};

