/**
 * @swagger
 * /api/common/status:
 *   get:
 *     summary: Get status master list
 *     tags:
 *       - Common
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status list fetched successfully
 *       401:
 *         description: Authentication token missing or invalid
 */

/**
 * @swagger
 * /api/common/customer-types:
 *   get:
 *     summary: Get customer type master list
 *     tags:
 *       - Common
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer types fetched successfully
 */

/**
 * @swagger
 * /api/common/screens:
 *   get:
 *     summary: Get application screens
 *     description: Admin-only API to fetch configured application screens.
 *     tags:
 *       - Common
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Screens fetched successfully
 *       403:
 *         description: Permission denied
 */

/**
 * @swagger
 * /api/common/autonos:
 *   get:
 *     summary: Get autonumber configuration
 *     description: Admin-only API to fetch autonumber configuration records.
 *     tags:
 *       - Common
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Autonumber configuration fetched successfully
 *       403:
 *         description: Permission denied
 */