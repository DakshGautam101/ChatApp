import express from "express";
import {verifyAuth} from "../middleware/verifyAuth.middleware.js"
import {getUserList} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/userlist" , verifyAuth , getUserList);

export default router;