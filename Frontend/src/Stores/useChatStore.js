import { create } from "zustand";
import {axiosInstance as axios} from "../lib/axiosInstance.js"
import { socket } from "../lib/socket.js";

const useChatStore = create((set , get) => ({
    conversations : [], 
    activeConversation : null,
    messages : null,
    typingUsers : {} ,
    isLoadingConversations : false,
    isLoadingMessages : false,

    fetchConversations : async()=>{
        try {
            set({isLoadingConversations : true});
            const res = await axios.get("/message/conversations");
            set({ conversations: res.data.conversations || [] });
        } catch (error) {
            console.error("fetchConversation error :", error);
        }finally{
            set({isLoadingConversations : false});
        }
    },

    openConversation : async (conversation)=>{
        set({activeConversation : conversation , messages : [] , isLoadingMessages : true});
        socket.emit("conversation:join" , conversation._id);

        try {
            const res = await axios.get(`/message/${conversation._id}`);
            set({messages : res.data.messages || []});

            const last = res.data.messages?.[res.data.messages.length - 1];
            if(last){
                socket.emit("message:read" , {
                    conversationId : conversation._id,
                    lastMessageId : last._id
                });
            }            
        } catch (error) {
            console.error("fetchConversation error :", error);
        }finally{
            set({isLoadingMessages : false});
        }
    },

    closeConversation : ()=>{
        set({activeConversation : null , messages : []});
    },

    sendMessage : (content)=>{
        const {activeConversation} = get();
        if(!activeConversation || !content?.trim()){
            return;
        }
        socket.emit("message:send" , {
            conversationId : activeConversation._id,
            content : content.trim()
        });
    },

    receiveMessage : (message)=>{
        const {activeConversation , conversations} = get();

        if(activeConversation._id === message.conversation){
            set((s)=>({
                messages : [...s.messages , message]
            }));
            socket.emit("message:read" , {
                conversationId : message.conversation,
                lastMessageId : message._id,
            });
        }
        const idx = conversations.findIndex((c)=> c._id === message.conversation);
        if(idx !== -1){
            const updated = [...conversations];
            const [conv] = updated.splice(idx , 1);
            conv.lastMessage = {
                text : message.content,
                sender : message.sender?._id || message.sender
            };
            updated.unshift(conv);
            set({conversations : updated});
        }
    },

    updateConversationPreview : ({conversationId , lastMessage}) => {
        set((s)=>{
            const idx = s.conversations.findIndex((c)=> c._id === conversationId);
            if(idx === -1)return s;
            const updated = [...conversations];
            const [conv] = updated.splice(idx , 1);
            conv.lastMessage = lastMessage;
            updated.unshift(conv);
            return {conversations : updated}
        });
    },

    setTyping : (conversationId , userId , isTyping)=>{
        set((s)=>{
            const current = new Set(s.typingUsers[conversationId]||[]);
            isTyping ? current.add(userId) : current.delete(userId);
            return {typingUsers : {...s.typingUsers , [conversationId] : current}};
        })
    },

    emitTyping : (isTyping) => {
        const {activeConversation} = get();
        if(!activeConversation)return;
        socket.emit("typing" , {
            conversationId : activeConversation._id,
            isTyping
        })
    },
}));

socket.on("message:new" , (message)=> useChatStore.getState().receiveMessage(message));
socket.on("conversation:updated" , (payload)=>{
    useChatStore.getState().updateConversationPreview(payload);
});
socket.on("typing" , ({userId , isTyping})=>{
    const {activeConversation} = useChatStore.getState();
    if(activeConversation){
        useChatStore.getState().setTyping(activeConversation._id , userId , isTyping);
    }
})


export default useChatStore;