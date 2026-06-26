// Express Router for user-related APIs.
import { Router } from "express";
// Controller functions for authentication.
import { register, login } from "../controllers/user.controller.js";
// Controller functions for meeting history/activity.
import { add_to_activity, get_all_activity } from "../controllers/meeting.controller.js";
// Middleware to verify JWT token.
import authenticateToken from "../middleware/Authmiddleware.js";

// Create router instance.
const router = Router();

router.route("/login").post(login);
router.route("/register").post(register);
router.route("/add_to_activity").post(authenticateToken, add_to_activity);
router.route("/get_all_activity").get(authenticateToken, get_all_activity);

export default router;
