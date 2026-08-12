import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import invitationRoutes from "./routes/invitation.routes.js";
import messageRoutes from "./routes/message.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import groupRoutes from "./routes/group.routes.js";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { init as initSocketHandlers } from "./socket/socketHandlers.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { requestLogger } from "./middleware/requestLogger.middleware.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const server = createServer(app);
const allowedOrigins = [process.env.CLIENT_URL || "http://localhost:5173"];

app.use(requestLogger);
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/invitation", invitationRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/group", groupRoutes);

app.use(errorHandler);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
    },
    maxHttpBufferSize: 25 * 1024 * 1024,
});

initSocketHandlers(io);

export { io, server };
