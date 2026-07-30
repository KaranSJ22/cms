/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticates a user using LOGINID and PASSWORD and returns a JWT token with role and customer information.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - LOGINID
 *               - PASSWORD
 *             properties:
 *               LOGINID:
 *                 type: string
 *                 example: ADMIN01
 *               PASSWORD:
 *                 type: string
 *                 example: Admin@123
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Invalid login ID or password
 */

/**
 * @swagger
 * /api/auth/sso:
 *   post:
 *     summary: SSO Login user
 *     description: Authenticates a user using an AES encrypted Base64Url token (containing username and expiry) and returns a standard CMS JWT token.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: AES encrypted Base64Url string containing "username:expiry"
 *                 example: mK5bn8QiqvY3TTmBlwVdgw9AbtI8S4ByPX4W01E2CEw
 *     responses:
 *       200:
 *         description: SSO Login successful
 *       400:
 *         description: Validation failed (missing token)
 *       401:
 *         description: Invalid, expired, or malformed SSO token
 */

/**
 * @swagger
 * /api/admin/test:
 *   get:
 *     summary: Test admin access
 *     description: Endpoint to verify if the authenticated user has ADMIN system role.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin access granted
 *       401:
 *         description: Authentication token missing or invalid
 *       403:
 *         description: Permission denied
 */