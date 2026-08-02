import {create} from "zustand";
import {axiosInstance as axios} from '../lib/axiosInstance.js';

const useAuthStore = create((set ,get)=>({
    user : null ,
    isAuthenticated : false ,
    isVerified : false, 
    isLoading : false,

    checkAuth : async()=>{
        const token = cookieStore.get("token")?.catch(()=>null);
        if(!token){
            set({
                user : null ,
                isAuthenticated : false ,
                isVerified : false,
                isLoading : false,
            })
            return false;
        }
        return true;
    },
    
    signup : async ({ username , email , password })=>{
        try {
            set({ isLoading: true });
            const res = await axios.post('/auth/signup' , {username , email , password}); 
            
            set({
                user : res.data.user,
                isAuthenticated : true ,
                isVerified : Boolean(res.data.user?.isVerified),
                isLoading : false,
            })

            return true;
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    login : async (email , pass)=>{
        try {
            set({ isLoading: true });
            const res = await axios.post('/auth/login' , { email , password: pass });

            set({
                user : res.data.user ,
                isAuthenticated : true,
                isLoading : false,
            })

            return true;
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    logout : async ()=>{
        try {
            const res = await axios.post('/auth/logout');
            
            set({
                user : null ,
                isAuthenticated : false,
                isLoading : false,
            })
        } catch (error) {
            throw error;
        }
    },

    verifyEmail : async(email , otp)=>{
        try {
            const { isVerified, isAuthenticated } = get();
            if(isVerified || !isAuthenticated){
                return true;
            }
            set({ isLoading: true });
            await axios.post('/auth/verify-email-otp' , {email , otp});
            
            set({
                isVerified : true,
                isLoading : false
            })

            return true;
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    resendEmail : async(email)=>{
        try {
            set({isLoading : true});

            await axios.post('/auth/resend-email-otp' , {email});
            

            set({isLoading : false});
            return true;

        } catch (error) {
            set({isLoading : false});
            throw error;
        }
    }

}))

export default useAuthStore;