import express from "express";
import dotenv from "dotenv";

const app = express();
dotenv.config();

app.post("/api/auth" , authRoutes);

app.listen(PORT , ()=>{
    console.log(`Server is running on port ${PORT}`);
})