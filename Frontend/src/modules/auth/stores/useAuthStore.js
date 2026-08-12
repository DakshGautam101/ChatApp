import { create } from "zustand";
import { axiosInstance as axios } from "@/core/api/axiosInstance.js";

const TOKEN_STORAGE_KEY = "chatapp_token";

const getStoredToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_STORAGE_KEY);
};

const persistToken = (token) => {
    if (typeof window === "undefined") return;
    if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
};

const useAuthStore = create((set, get) => ({
    user: null,
    isAuthenticated: Boolean(getStoredToken()),
    isVerified: false,
    isLoading: false,
    token: getStoredToken(),

    checkAuth: async () => {
        const storedToken = getStoredToken();
        set({ isLoading: true, token: storedToken });
        try {
            const res = await axios.get('/auth/me');
            set({
                user: res.data.user,
                isAuthenticated: true,
                isVerified: Boolean(res.data.user?.isVerified),
                isLoading: false,
                token: storedToken,
            });
            return true;
        } catch (err) {
            persistToken(null);
            set({
                user: null,
                isAuthenticated: false,
                isVerified: false,
                isLoading: false,
                token: null,
            });
            return false;
        }
    },

    signup: async ({ username, email, phone, password, avatar }) => {
        try {
            set({ isLoading: true });
            const res = await axios.post('/auth/signup', { username, email, phone, password, avatar });
            const token = res.data?.token || null;
            persistToken(token);

            set({
                user: res.data.user,
                isAuthenticated: true,
                isVerified: Boolean(res.data.user?.isVerified),
                isLoading: false,
                token,
            });

            return true;
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    updateProfile: async (updateData) => {
        try {
            set({ isLoading: true });
            const res = await axios.put('/user/profile', updateData);
            const updatedUser = res.data?.user;
            if (updatedUser) {
                set((state) => ({
                    user: { ...state.user, ...updatedUser },
                    isLoading: false,
                }));
            }
            return true;
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    login: async (email, pass) => {
        try {
            set({ isLoading: true });
            const res = await axios.post('/auth/login', { email, password: pass });
            const token = res.data?.token || null;
            persistToken(token);

            set({
                user: res.data.user,
                isAuthenticated: true,
                isLoading: false,
                token,
            });

            return true;
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    logout: async () => {
        try {
            await axios.post('/auth/logout');
        } catch (error) {
            // ignore logout errors and still clear local auth state
        } finally {
            persistToken(null);
            set({
                user: null,
                isAuthenticated: false,
                isVerified: false,
                isLoading: false,
                token: null,
            });
        }
    },

    verifyEmail: async (email, otp) => {
        try {
            const { isVerified, isAuthenticated } = get();
            if (isVerified || !isAuthenticated) {
                return true;
            }
            set({ isLoading: true });
            const res = await axios.post('/auth/verify-email-otp', { email, otp });
            const token = res.data?.token || get().token;
            persistToken(token);

            set({
                isVerified: true,
                isLoading: false,
                token,
            });

            return true;
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    resendEmail: async (email) => {
        try {
            set({ isLoading: true });
            await axios.post('/auth/resend-email-otp', { email });
            set({ isLoading: false });
            return true;
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    }
}));

export default useAuthStore;
