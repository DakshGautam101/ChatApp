import axios from "axios";
import { disconnectSocket } from "../socket/socket.js";

const API_URL =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? "http://localhost:5000" : "https://chatapp-backend-s1n2.onrender.com");
const cleanBase = API_URL.replace(/\/api\/?$/, "");

export const axiosInstance = axios.create({
    baseURL: `${cleanBase}/api`,
    withCredentials: true,
});

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Cookie missing, expired, deleted, or revoked
            disconnectSocket();

            const currentPath = window.location.pathname;
            const publicAuthPaths = ["/login", "/signup", "/verify-email"];
            if (!publicAuthPaths.includes(currentPath)) {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);
