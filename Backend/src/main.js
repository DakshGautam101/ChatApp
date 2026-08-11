import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./utils/db.js";
import {server} from "./app.js";


connectDB();

server.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
})