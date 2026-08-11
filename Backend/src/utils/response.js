export const sendError = (res, status, message) => res.status(status).json({ success: false, message });

export const sendSuccess = (res, status, data, message = null) => {
    const payload = { success: true, ...(message ? { message } : {}) };
    return res.status(status).json({ ...payload, ...data });
};
