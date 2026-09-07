/**
 * @swagger
 * /api/day-slots/{id}/menu:
 *   get:
 *     summary: Get day menu workspace
 *     description: Canteen manager or assistant API to fetch the full menu workspace for a specific day slot.
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
 *     responses:
 *       200:
 *         description: Day menu workspace fetched successfully
 *       404:
 *         description: Day slot not found
 *
 *   put:
 *     summary: Replace day menu items
 *     description: Canteen manager or assistant API to atomically replace the draft/pending day menu items for a slot.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ITEMSJSON
 *             properties:
 *               ITEMSJSON:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     MENUITEMID:
 *                       type: integer
 *                     ISBASE:
 *                       type: integer
 *                     ISSPECIAL:
 *                       type: integer
 *                     ISPREBOOK:
 *                       type: integer
 *                     ISKIOSK:
 *                       type: integer
 *                     AVAILQTY:
 *                       type: integer
 *                       nullable: true
 *                     MAXQTY:
 *                       type: integer
 *                     BOOKUNTIL:
 *                       type: string
 *                     CANCELUNTIL:
 *                       type: string
 *                     REMARKS:
 *                       type: string
 *                       nullable: true
 *     responses:
 *       200:
 *         description: Day menu items replaced successfully
 *       400:
 *         description: Validation failed
 *       403:
 *         description: Permission denied
 *
 * /api/day-slots/{id}/menu/submit:
 *   post:
 *     summary: Submit day menu for approval
 *     description: API to submit a draft menu for approval.
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
 *     responses:
 *       200:
 *         description: Day menu submitted successfully
 *       403:
 *         description: Permission denied
 *
 * /api/day-slots/{id}/menu/approve:
 *   post:
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
 *     responses:
 *       200:
 *         description: Day menu approved successfully
 *       400:
 *         description: Validation failed
 *       403:
 *         description: Permission denied
 *
 * /api/day-slots/{id}/menu/reject:
 *   post:
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
 *     responses:
 *       200:
 *         description: Day menu rejected successfully
 *       400:
 *         description: Validation failed
 *       403:
 *         description: Permission denied
 *
 * /api/day-menus/pending:
 *   get:
 *     summary: Get pending day menus
 *     description: Canteen manager API to fetch all day slots with a pending menu.
 *     tags:
 *       - Day Menu
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: canteenId
 *         required: false
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pending day menus fetched successfully
 *       403:
 *         description: Permission denied
 *
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
 *         name: canteenId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: serviceDate
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Published menu fetched successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication token missing or invalid
 *       403:
 *         description: Permission denied
 */
