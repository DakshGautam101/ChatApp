import { create } from "zustand";
import { axiosInstance as axios } from "@/core/api/axiosInstance.js";
import { hasAuthCookie } from "@/core/utils/authCookie.js";

const useAuthStore = create((set, get) => ({
    user: null,
    isAuthenticated: hasAuthCookie(),
    isVerified: false,
    isLoading: false,

    checkAuth: async () => {
        if (!hasAuthCookie()) {
            set({
                user: null,
                isAuthenticated: false,
                isVerified: false,
                isLoading: false,
            });
            return false;
        }

        set({ isLoading: true });
        try {
            const res = await axios.get('/auth/me');
            set({
                user: res.data.user,
                isAuthenticated: true,
                isVerified: Boolean(res.data.user?.isVerified),
                isLoading: false,
            });
            return true;
        } catch (err) {
            set({
                user: null,
                isAuthenticated: false,
                isVerified: false,
                isLoading: false,
            });
            return false;
        }
    },

    signup: async ({ username, email, phone, password, avatar }) => {
        try {
            set({ isLoading: true });
            const res = await axios.post('/auth/signup', { username, email, phone, password, avatar });

            set({
                user: res.data.user,
                isAuthenticated: true,
                isVerified: Boolean(res.data.user?.isVerified),
                isLoading: false,
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

            set({
                user: res.data.user,
                isAuthenticated: true,
                isLoading: false,
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
            // ignore logout errors 
        } finally {
            set({
                user: null,
                isAuthenticated: false,
                isVerified: false,
                isLoading: false,
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
            await axios.post('/auth/verify-email-otp', { email, otp });

            set({
                isVerified: true,
                isLoading: false,
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

