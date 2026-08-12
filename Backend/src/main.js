import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./utils/db.js";
import { server } from "./app.js";
import logger from "./utils/logger.js";

connectDB();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});