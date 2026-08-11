import axios from "axios";
import { axiosInstance } from "../api/axiosInstance.js";

const API_BASE = axiosInstance.defaults.baseURL;
const MAX_ATTEMPTS = 5;
const BACKOFF_BASE_MS = 1000;

const activeUploads = new Map(); 

function generateUploadId() {
    return typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `upl_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function sendBeaconInterrupt(uploadId) {
    try {
        const blob = new Blob([JSON.stringify({ uploadId })], { type: "application/json" });
        navigator.sendBeacon(`${API_BASE}/upload/interrupt`, blob);
    } catch (err) {
    }
}
if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => {
        for (const uploadId of activeUploads.keys()) {
            sendBeaconInterrupt(uploadId);
        }
    });
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForOnline = () =>
    new Promise((resolve) => {
        if (navigator.onLine) return resolve();
        const handler = () => {
            window.removeEventListener("online", handler);
            resolve();
        };
        window.addEventListener("online", handler);
    });

async function uploadWithProgress(file, uploadId, onProgress, signal) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploadId", uploadId);

    try {
        const response = await axiosInstance.post("/upload/single", formData, {
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                    onProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
                }
            },
            signal,
        });

        return response.data;
    } catch (err) {
        if (axios.isCancel(err) || err.name === "CanceledError" || err.code === "ERR_CANCELED") {
            throw new Error("aborted");
        }
        if (!err.response) {
            throw new Error("network");
        }
        throw new Error(`Upload failed with status ${err.response.status}`);
    }
}

export function uploadFileRecoverable(file, { onStatusChange, onProgress, conversationId } = {}) {
    const uploadId = generateUploadId();
    let cancelled = false;
    const controller = new AbortController();

    activeUploads.set(uploadId, { file, conversationId });

    axiosInstance
        .post("/upload/session/start", {
            uploadId,
            filename: file.name,
            mimetype: file.type,
            size: file.size,
            conversationId,
        })
        .catch(() => {});

    const promise = (async () => {
        let attempt = 0;

        while (attempt < MAX_ATTEMPTS && !cancelled) {
            attempt += 1;
            try {
                onStatusChange?.("uploading", { attempt });
                const result = await uploadWithProgress(
                    file,
                    uploadId,
                    (percent) => onProgress?.(percent),
                    controller.signal
                );
                activeUploads.delete(uploadId);
                onStatusChange?.("completed", { attempt });
                return { ...result.file, uploadId };
            } catch (err) {
                if (cancelled || err.message === "aborted") throw err;

                const isNetworkIssue = err.message === "network" || !navigator.onLine;

                if (isNetworkIssue && attempt < MAX_ATTEMPTS) {
                    onStatusChange?.("reconnecting", { attempt });
                    await waitForOnline();
                    await wait(BACKOFF_BASE_MS * attempt);
                    continue;
                }

                if (attempt < MAX_ATTEMPTS) {
                    await wait(BACKOFF_BASE_MS * attempt);
                    continue;
                }

                activeUploads.delete(uploadId);
                onStatusChange?.("failed", { attempt, error: err.message });
                throw err;
            }
        }

        activeUploads.delete(uploadId);
        onStatusChange?.("failed", { attempt, error: "cancelled" });
        throw new Error("Upload cancelled");
    })();

    return {
        uploadId,
        promise,
        cancel: () => {
            cancelled = true;
            controller.abort();
            activeUploads.delete(uploadId);
        },
    };
}
