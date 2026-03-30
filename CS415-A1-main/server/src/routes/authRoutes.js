const express = require("express");
const authController = require("../controllers/authController");
const router = express.Router();

router.post("/auth/register", authController.register);

router.post("/register", authController.register);

router.post("/auth/login", authController.login);

router.post("/login", authController.login);

router.post("/auth/forgot-password", authController.forgotPassword);

router.post("/auth/reset-password", authController.resetPassword);

router.post("/auth/admin-verify", authController.verifyAdmin);

module.exports = router;
