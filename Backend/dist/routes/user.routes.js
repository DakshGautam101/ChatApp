import express from "express";
import { verifyAuth } from "../middleware/verifyAuth.middleware.js";
import { getUserList, updateProfile } from "../controllers/user.controller.js";
const router = express.Router();
router.get("/userlist", verifyAuth, getUserList);
router.put("/profile", verifyAuth, updateProfile);
export default router;
//# sourceMappingURL=user.routes.js.map