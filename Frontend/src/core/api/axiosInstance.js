import axios from "axios";
import { disconnectSocket } from "../socket/socket.js";
import useAuthStore from "@/modules/auth/stores/useAuthStore.js";

export const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api',
    withCredentials: true,
});

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            disconnectSocket();
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);

