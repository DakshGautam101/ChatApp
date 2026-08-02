import "dotenv/config";
import express from "express";
import connectDB from "./services/db.js";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import cors from "cors";

const app = express();

const allowedOrigins = [process.env.CLIENT_URL];

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use("/api/auth", authRoutes);

connectDB();

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
})