/**
 * @swagger
 * /api/day-slots:
 *   get:
 *     summary: Get all day slots
 *     description: Fetches configured canteen day slots.
 *     tags:
 *       - Day Slot
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Day slots fetched successfully
 *       401:
 *         description: Authentication token missing or invalid
 *       403:
 *         description: Permission denied
 *
 *   post:
 *     summary: Create day slot
 *     description: Admin or canteen manager API to create a service slot for a date.
 *     tags:
 *       - Day Slot
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - SERVICEID
 *               - SERVDATE
 *               - STARTTIME
 *               - ENDTIME
 *             properties:
 *               SERVICEID:
 *                 type: integer
 *                 example: 2
 *               SERVDATE:
 *                 type: string
 *                 example: "2026-06-28"
 *               STARTTIME:
 *                 type: string
 *                 example: "07:30:00"
 *               ENDTIME:
 *                 type: string
 *                 example: "09:30:00"
 *     responses:
 *       201:
 *         description: Day slot created successfully
 *       400:
 *         description: Validation failed
 *       403:
 *         description: Permission denied
 */

/**
 * @swagger
 * /api/day-slots/{id}:
 *   get:
 *     summary: Get day slot by ID
 *     tags:
 *       - Day Slot
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
 *         description: Day slot fetched successfully
 *       404:
 *         description: Day slot not found
 *
 *   put:
 *     summary: Update day slot
 *     description: Admin or canteen manager API to replace day slot timing and status.
 *     tags:
 *       - Day Slot
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - STARTTIME
 *               - ENDTIME
 *               - STATUS
 *             properties:
 *               STARTTIME:
 *                 type: string
 *                 example: "07:30:00"
 *               ENDTIME:
 *                 type: string
 *                 example: "09:30:00"
 *               STATUS:
 *                 type: string
 *                 example: A
 *               CHGREASON:
 *                 type: string
 *                 nullable: true
 *                 example: Updated day slot timing
 *     responses:
 *       200:
 *         description: Day slot updated successfully
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Day slot not found
 */
