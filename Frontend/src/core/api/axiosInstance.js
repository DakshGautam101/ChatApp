import axios from "axios";
import { disconnectSocket } from "../socket/socket.js";

export const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000/api',
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
