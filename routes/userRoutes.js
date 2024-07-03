const router = require("express").Router();
const userController = require("../controllers/userController");
const verifyToken = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRoles");

router.post(
  "/register",
  verifyToken,
  authorizeRoles("driver", "company", "super_admin"),
  userController.register
);
router.post(
  "/login",
  verifyToken,
  authorizeRoles("driver", "company", "super_admin"),
  userController.login
);
router.get(
  "/",
  verifyToken,
  authorizeRoles("driver", "company", "super_admin"),
  userController.getUserByRole
);
router.post(
  "/forgot-password",
  verifyToken,
  authorizeRoles("driver", "company", "super_admin"),
  userController.forgotPassword
);
router.post(
  "/verify-otp",
  verifyToken,
  authorizeRoles("driver", "company", "super_admin"),
  userController.verifyOTP
);
router.get(
  "/:id",
  verifyToken,
  authorizeRoles("driver", "company", "super_admin"),
  userController.getUserById
);
router.put(
  "/:id",
  verifyToken,
  authorizeRoles("driver", "company", "super_admin"),
  userController.updateUserById
);
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("driver", "company", "super_admin"),
  userController.deleteUserById
);

module.exports = router;
