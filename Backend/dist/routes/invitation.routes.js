import express from "express";
import { verifyAuth } from "../middleware/verifyAuth.middleware.js";
import { changeStatus, getInvitation, sendInvitation } from "../controllers/invitation.controller.js";
const router = express.Router();
router.post('/send/:id', verifyAuth, sendInvitation);
router.patch('/:id', verifyAuth, changeStatus);
router.get('/invitation', verifyAuth, getInvitation);
export default router;
//# sourceMappingURL=invitation.routes.js.map