/**
 * @swagger
 * /api/day-menus:
 *   get:
 *     summary: Get all day menus
 *     description: Admin or canteen manager API to fetch configured day menus.
 *     tags:
 *       - Day Menu
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Day menus fetched successfully
 *       401:
 *         description: Authentication token missing or invalid
 *       403:
 *         description: Permission denied
 *
 *   post:
 *     summary: Create day menu
 *     description: Admin, canteen manager, or canteen staff API to add a menu item to a day slot.
 *     tags:
 *       - Day Menu
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - DAYSLOTID
 *               - MENUITEMID
 *               - AVAILQTY
 *               - MAXQTY
 *               - BOOKSTART
 *               - BOOKEND
 *               - CANCELAT
 *             properties:
 *               DAYSLOTID:
 *                 type: integer
 *                 example: 1
 *               MENUITEMID:
 *                 type: integer
 *                 example: 3
 *               ISSPECIAL:
 *                 type: integer
 *                 example: 0
 *               ISPREBOOK:
 *                 type: integer
 *                 example: 1
 *               ISWALKIN:
 *                 type: integer
 *                 example: 1
 *               ISKIOSK:
 *                 type: integer
 *                 example: 1
 *               AVAILQTY:
 *                 type: integer
 *                 example: 100
 *               MAXQTY:
 *                 type: integer
 *                 example: 2
 *               BOOKSTART:
 *                 type: string
 *                 example: "2026-06-28T06:00:00.000Z"
 *               BOOKEND:
 *                 type: string
 *                 example: "2026-06-28T08:00:00.000Z"
 *               CANCELAT:
 *                 type: string
 *                 example: "2026-06-28T08:30:00.000Z"
 *               REMARKS:
 *                 type: string
 *                 nullable: true
 *                 example: Breakfast item
 *     responses:
 *       201:
 *         description: Day menu created successfully
 *       400:
 *         description: Validation failed
 *       403:
 *         description: Permission denied
 */

/**
 * @swagger
 * /api/day-menus/{id}:
 *   get:
 *     summary: Get day menu by ID
 *     tags:
 *       - Day Menu
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Day menu fetched successfully
 *       404:
 *         description: Day menu not found
 */

/**
 * @swagger
 * /api/day-menus/{id}/approve:
 *   patch:
 *     summary: Approve day menu
 *     description: Admin or canteen manager API to approve a pending day menu.
 *     tags:
 *       - Day Menu
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               REMARKS:
 *                 type: string
 *                 nullable: true
 *                 example: Approved
 *     responses:
 *       200:
 *         description: Day menu approved successfully
 *       400:
 *         description: Validation failed
 *       403:
 *         description: Permission denied
 */

/**
 * @swagger
 * /api/day-menus/{id}/reject:
 *   patch:
 *     summary: Reject day menu
 *     description: Admin or canteen manager API to reject a pending day menu.
 *     tags:
 *       - Day Menu
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               REMARKS:
 *                 type: string
 *                 nullable: true
 *                 example: Rejected due to duplicate item
 *     responses:
 *       200:
 *         description: Day menu rejected successfully
 *       400:
 *         description: Validation failed
 *       403:
 *         description: Permission denied
 */

/**
 * @swagger
 * /api/menus:
 *   get:
 *     summary: View published menu
 *     description: Authenticated user API to fetch approved published menu for a service date.
 *     tags:
 *       - Day Menu
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: serviceDate
 *         required: true
 *         schema:
 *           type: string
 *         example: "2026-06-28"
 *     responses:
 *       200:
 *         description: Published menu fetched successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication token missing or invalid
 */
