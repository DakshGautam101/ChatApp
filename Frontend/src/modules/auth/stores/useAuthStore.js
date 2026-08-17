import { create } from "zustand";
import { axiosInstance as axios } from "@/core/api/axiosInstance.js";

const useAuthStore = create((set, get) => ({
    user: null,
    isAuthenticated: false,
    isVerified: false,
    isLoading: true,

    checkAuth: async () => {
        set({ isLoading: true });
        try {
            const res = await axios.get('/auth/me');
            const user = res.data?.user || res.data?.data?.user;
            set({
                user: user,
                isAuthenticated: true,
                isVerified: Boolean(user?.isVerified),
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
            const registeredUser = res.data?.user || res.data?.data?.user || { email, username, phone, avatar, isVerified: false };

            set({
                user: registeredUser,
                isAuthenticated: false,
                isVerified: false,
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
            const updatedUser = res.data?.user || res.data?.data?.user;
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
            const loggedInUser = res.data?.user || res.data?.data?.user;

            set({
                user: loggedInUser,
                isAuthenticated: true,
                isVerified: Boolean(loggedInUser?.isVerified),
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
            // ignore logout errors and still clear local auth state
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
            set({ isLoading: true });
            const res = await axios.post('/auth/verify-email-otp', { email, otp });
            const verifiedUser = res.data?.user || res.data?.data?.user;

            set({
                user: verifiedUser || get().user,
                isAuthenticated: true,
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

