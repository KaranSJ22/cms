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