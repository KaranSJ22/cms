/**
 * @swagger
 * /health:
 *   get:
 *     summary: Backend health check
 *     description: Checks whether the CMS backend server is running.
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Backend server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 SUCCESS:
 *                   type: boolean
 *                   example: true
 *                 MESSAGE:
 *                   type: string
 *                   example: CMS backend is running
 *                 ENVIRONMENT:
 *                   type: string
 *                   example: development
 */

/**
 * @swagger
 * /health/db:
 *   get:
 *     summary: Database health check
 *     description: Checks whether the backend can connect to the MySQL database.
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Database connection successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 SUCCESS:
 *                   type: boolean
 *                   example: true
 *                 MESSAGE:
 *                   type: string
 *                   example: Database connection successful
 *                 DATA:
 *                   type: object
 *                   properties:
 *                     RESULT:
 *                       type: integer
 *                       example: 1
 *       500:
 *         description: Database connection failed
 */