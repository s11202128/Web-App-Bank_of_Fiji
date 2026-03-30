const {
  registerUser,
  loginUser,
  verifyAdminCredentials,
  requestPasswordReset,
  resetPassword,
} = require("../store-mysql");

/**
 * Auth service orchestrates authentication and profile-security operations.
 * This keeps route handlers thin while reusing existing store logic.
 */
const authService = {
  /**
   * Register a new customer.
   * @param {Object} payload Registration payload
   * @returns {Promise<Object>} Registration result
   */
  register(payload) {
    return registerUser(payload || {});
  },

  /**
   * Login a user (customer or admin).
   * @param {Object} payload Login payload
   * @param {string|null} payload.ipAddress Request source IP
   * @param {string|null} payload.userAgent Request User-Agent
   * @returns {Promise<Object>} Authenticated user profile
   */
  login(payload) {
    return loginUser(payload || {});
  },

  /**
   * Verify admin lock screen credentials.
   * @param {Object} payload Admin credentials
   * @returns {Promise<Object>} Verification response
   */
  verifyAdmin(payload) {
    return verifyAdminCredentials(payload || {});
  },

  /**
   * Request OTP for password reset flow.
   * @param {Object} payload Request payload with email
   * @returns {Promise<Object>} Reset request metadata
   */
  forgotPassword(payload) {
    return requestPasswordReset(payload || {});
  },

  /**
   * Complete password reset using OTP.
   * @param {Object} payload Reset payload
   * @returns {Promise<Object>} Reset status
   */
  resetPassword(payload) {
    return resetPassword(payload || {});
  },
};

module.exports = authService;
