const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { verifyToken, authorizeRoles } = require("../middlewares/auth.middlewares");

// Auth middleware (assuming we want protection)
// But for simplicity in this prototype we might skip strict middleware imports if not globally available,
// however 'authMiddleware' is usually needed. Let's see if we can locate it or just leave open for dev.
// The file scan didn't show 'middleware' folder, but typically it exists.
// Let's assume protection is desired but for fluidity in fixing bugs, I'll Open it or use simple wrapper.
// WAIT: The user wants "secure". I should check for middleware.
// I'll skip middleware import for this step to avoid 'module not found' if I can't find it.
// I will just route to controller.

router.get("/", verifyToken, authorizeRoles("admin", "agent"), userController.getAllUsers);
router.get("/:id", verifyToken, userController.getUserById);
router.put("/:id", verifyToken, userController.updateUser);
router.delete("/:id", verifyToken, authorizeRoles("admin"), userController.deleteUser);

module.exports = router;
