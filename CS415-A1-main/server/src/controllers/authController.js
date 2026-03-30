const jwt = require("jsonwebtoken");
const authService = require("../services/authService");

const JWT_SECRET = process.env.JWT_SECRET || "bof-dev-secret-2026";

function buildAuthResponse(user) {
  const token = jwt.sign(
    {
      userId: user.userId,
      email: user.email,
      fullName: user.fullName,
      isAdmin: Boolean(user.isAdmin),
    },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  return {
    token,
    fullName: user.fullName,
    userId: user.userId,
    customerId: user.customerId,
    email: user.email,
    mobile: user.mobile,
    nationalId: user.nationalId,
    isAdmin: Boolean(user.isAdmin),
  };
}

function handleError(res, err, fallbackStatus) {
  const status = Number(err?.statusCode) || fallbackStatus;
  return res.status(status).json({ error: err.message });
}

/**
 * Controller methods for auth endpoints.
 * Keeps HTTP concerns separated from service/business logic.
 */
const authController = {
  async register(req, res) {
    try {
      const result = await authService.register(req.body || {});
      return res.status(201).json(result);
    } catch (err) {
      return handleError(res, err, 400);
    }
  },

  async login(req, res) {
    try {
      const user = await authService.login({
        ...(req.body || {}),
        ipAddress: req.ip,
        userAgent: req.get("user-agent") || "",
      });
      return res.json(buildAuthResponse(user));
    } catch (err) {
      return handleError(res, err, 401);
    }
  },

  async forgotPassword(req, res) {
    try {
      const result = await authService.forgotPassword(req.body || {});
      return res.json(result);
    } catch (err) {
      return handleError(res, err, 400);
    }
  },

  async resetPassword(req, res) {
    try {
      const result = await authService.resetPassword(req.body || {});
      return res.json(result);
    } catch (err) {
      return handleError(res, err, 400);
    }
  },

  async verifyAdmin(req, res) {
    try {
      const result = await authService.verifyAdmin(req.body || {});
      return res.json(result);
    } catch (err) {
      return handleError(res, err, 401);
    }
  },
};

module.exports = authController;
