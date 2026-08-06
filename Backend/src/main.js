import "dotenv/config";
import express from "express";
import connectDB from "./services/db.js";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import invitationRoutes from "./routes/invitation.routes.js";
import messageRoutes from "./routes/message.routes.js"
import uploadRoutes from "./routes/upload.routes.js"
import {createServer} from "http";
import { Server } from "socket.io";
import cors from "cors";
import { init as initSocketHandlers } from "./socket/socketHandlers.js";

const app = express();
const server = createServer(app);
const allowedOrigins = [process.env.CLIENT_URL];

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use("/api/auth", authRoutes);
app.use("/api/user" , userRoutes);
app.use("/api/invitation" , invitationRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/upload" , uploadRoutes);

const io = new Server(server, {
    cors :{
        origin : allowedOrigins,
        credentials : true
    },
    maxHttpBufferSize: 25 * 1024 * 1024,
})

initSocketHandlers(io);

export { io };

connectDB();

server.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
})