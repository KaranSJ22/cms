/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Get all canteen services
 *     description: Fetches configured canteen services.
 *     tags:
 *       - Service
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Services fetched successfully
 *       401:
 *         description: Authentication token missing or invalid
 *       403:
 *         description: Permission denied
 *
 *   post:
 *     summary: Create canteen service
 *     description: Admin or canteen manager API to create a canteen service.
 *     tags:
 *       - Service
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - SERVCODE
 *               - SERVNAME
 *               - DEFSTART
 *               - DEFEND
 *             properties:
 *               SERVCODE:
 *                 type: string
 *                 example: BREAKFAST
 *               SERVNAME:
 *                 type: string
 *                 example: Breakfast
 *               DEFSTART:
 *                 type: string
 *                 example: "07:30:00"
 *               DEFEND:
 *                 type: string
 *                 example: "09:30:00"
 *               VALIDFROM:
 *                 type: string
 *                 nullable: true
 *                 example: "2026-01-01"
 *               VALIDUNTIL:
 *                 type: string
 *                 nullable: true
 *                 example: null
 *     responses:
 *       201:
 *         description: Service created successfully
 *       400:
 *         description: Validation failed
 *       403:
 *         description: Permission denied
 */

/**
 * @swagger
 * /api/services/{id}:
 *   get:
 *     summary: Get canteen service by ID
 *     tags:
 *       - Service
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
 *         description: Service fetched successfully
 *       404:
 *         description: Service not found
 *
 *   put:
 *     summary: Update canteen service
 *     description: Admin or canteen manager API to replace service configuration.
 *     tags:
 *       - Service
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
 *               - SERVNAME
 *               - DEFSTART
 *               - DEFEND
 *               - STATUS
 *             properties:
 *               SERVNAME:
 *                 type: string
 *                 example: Breakfast
 *               DEFSTART:
 *                 type: string
 *                 example: "07:30:00"
 *               DEFEND:
 *                 type: string
 *                 example: "09:30:00"
 *               VALIDFROM:
 *                 type: string
 *                 nullable: true
 *                 example: "2026-01-01"
 *               VALIDUNTIL:
 *                 type: string
 *                 nullable: true
 *                 example: null
 *               STATUS:
 *                 type: string
 *                 example: A
 *               CHGREASON:
 *                 type: string
 *                 nullable: true
 *                 example: Updated breakfast timing
 *     responses:
 *       200:
 *         description: Service updated successfully
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Service not found
 */
