export const sendError = (res, status, message) => res.status(status).json({ success: false, message });

export const sendSuccess = (res, status, data, message = null) => {
    const payload = { success: true, ...(message ? { message } : {}) };
    if (Array.isArray(data)) {
        return res.status(status).json({ ...payload, data });
    }
    if (data && typeof data === "object") {
        return res.status(status).json({ ...payload, ...data });
    }
    return res.status(status).json({ ...payload, data });
};

