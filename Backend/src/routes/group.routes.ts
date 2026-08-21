import express from "express";
import { verifyAuth } from "../middleware/verifyAuth.middleware.js";
import { isAdmin } from "../middleware/admin.middleware.js";
import {
    createGroup,
    sendGroupInvitation,
    getPendingGroupInvitations,
    respondToGroupInvitation,
    searchUsersForGroup,
    updateGroupAvatar,
    updateMemberRole,
    leaveGroup,
    kickMember,
} from "../controllers/group.controller.js";

const router = express.Router();

router.post("/create", verifyAuth, createGroup);
router.get("/invitations", verifyAuth, getPendingGroupInvitations);
router.post("/invitation/:invitationId/respond", verifyAuth, respondToGroupInvitation);
router.post("/:groupId/invitation", verifyAuth, isAdmin, sendGroupInvitation);
router.get("/:groupId/search-users", verifyAuth, searchUsersForGroup);
router.patch("/:groupId/avatar", verifyAuth, isAdmin, updateGroupAvatar);
router.patch("/:groupId/members/:targetUserId/role", verifyAuth, isAdmin, updateMemberRole);
router.post("/:groupId/leave", verifyAuth, leaveGroup);
router.delete("/:groupId/members/:targetUserId", verifyAuth, isAdmin, kickMember);

export default router;