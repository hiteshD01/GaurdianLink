const router = require("express").Router();
const userController = require("../controllers/userController");
const verifyToken = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRoles");
const optionalAuth = require("../middlewares/optionalAuth");

router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/check-login", userController.checkLogin);
router.post("/forgot-password", userController.forgotPassword);
router.post("/reset-password/:token", userController.resetPassword);

// router.get(
//   "/",
//   verifyToken,
//   authorizeRoles("driver", "company", "super_admin"),
//   userController.getUserByRole
// );

router.get(
  "/",
  optionalAuth,
  (req, res, next) => {
    if (req.user) {
      verifyToken(req, res, () => {
        authorizeRoles("driver", "company", "super_admin")(req, res, next);
      });
    } else {
      next();
    }
  },
  userController.getUserByRole
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
