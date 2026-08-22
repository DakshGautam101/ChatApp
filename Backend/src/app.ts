import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import invitationRoutes from "./routes/invitation.routes.js";
import messageRoutes from "./routes/message.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import groupRoutes from "./routes/group.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { init as initSocketHandlers } from "./socket/socketHandlers.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { requestLogger } from "./middleware/requestLogger.middleware.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename:string = fileURLToPath(import.meta.url);
const __dirname:string = path.dirname(__filename);

const app = express();

const server = createServer(app);
const configuredOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map((url) => url.trim().replace(/\/$/, ""))
    .filter(Boolean);

const defaultAllowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "https://chat-jx6fkkzc5-dakshgautam101s-projects.vercel.app",
    "https://chat-app-lemon-nu-vuk0r89tf6.vercel.app",
    ...configuredOrigins,
];

const isAllowedOrigin = (origin: string | undefined): boolean => {
    // Allow non-browser requests or same-origin requests without Origin header
    if (!origin) return true;

    const cleanOrigin = origin.trim().replace(/\/$/, "");

    if (defaultAllowedOrigins.includes(cleanOrigin)) return true;

    // Allow all Vercel deployment URLs (preview, branch, and production)
    if (
        /\.vercel\.app$/i.test(cleanOrigin) ||
        /-dakshgautam101s-projects\.vercel\.app$/i.test(cleanOrigin)
    ) {
        return true;
    }

    return false;
};

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`Not allowed by CORS: ${origin}`));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
};

app.use(requestLogger);
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/invitation", invitationRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/group", groupRoutes);
app.use("/api/notification", notificationRoutes);

app.use(errorHandler);

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (isAllowedOrigin(origin)) {
                callback(null, true);
            } else {
                callback(new Error(`Socket CORS blocked for origin: ${origin}`));
            }
        },
        credentials: true,
    },
    maxHttpBufferSize: 25 * 1024 * 1024,
});

initSocketHandlers(io);

export { io, server };
