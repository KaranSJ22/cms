/**
 * @swagger
 * /api/menu-items:
 *   get:
 *     summary: Get all menu items
 *     description: Fetches configured canteen menu items.
 *     tags:
 *       - Menu
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Menu items fetched successfully
 *       401:
 *         description: Authentication token missing or invalid
 *       403:
 *         description: Permission denied
 *
 *   post:
 *     summary: Create menu item
 *     description: Admin or canteen manager API to create a menu item.
 *     tags:
 *       - Menu
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - MENUCODE
 *               - SHORTNAME
 *               - ITEMNAME
 *               - PERMPRICE
 *               - CONTPRICE
 *               - VISPRICE
 *               - OFFPRICE
 *             properties:
 *               MENUCODE:
 *                 type: string
 *                 example: M0006
 *               SHORTNAME:
 *                 type: string
 *                 example: DOSA
 *               ITEMNAME:
 *                 type: string
 *                 example: Masala Dosa
 *               ITEMDESCR:
 *                 type: string
 *                 nullable: true
 *                 example: Dosa with chutney and sambar
 *               PERMPRICE:
 *                 type: number
 *                 example: 30.00
 *               CONTPRICE:
 *                 type: number
 *                 example: 40.00
 *               VISPRICE:
 *                 type: number
 *                 example: 50.00
 *               OFFPRICE:
 *                 type: number
 *                 example: 50.00
 *               ISSPECIAL:
 *                 type: integer
 *                 example: 0
 *     responses:
 *       201:
 *         description: Menu item created successfully
 *       400:
 *         description: Validation failed
 *       403:
 *         description: Permission denied
 */

/**
 * @swagger
 * /api/menu-items/{id}:
 *   get:
 *     summary: Get menu item by ID
 *     tags:
 *       - Menu
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
 *         description: Menu item fetched successfully
 *       404:
 *         description: Menu item not found
 *
 *   put:
 *     summary: Update menu item
 *     description: Admin or canteen manager API to replace menu item configuration.
 *     tags:
 *       - Menu
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
 *               - SHORTNAME
 *               - ITEMNAME
 *               - PERMPRICE
 *               - CONTPRICE
 *               - VISPRICE
 *               - OFFPRICE
 *               - STATUS
 *             properties:
 *               SHORTNAME:
 *                 type: string
 *                 example: DOSA
 *               ITEMNAME:
 *                 type: string
 *                 example: Masala Dosa
 *               ITEMDESCR:
 *                 type: string
 *                 nullable: true
 *                 example: Dosa with chutney and sambar
 *               PERMPRICE:
 *                 type: number
 *                 example: 30.00
 *               CONTPRICE:
 *                 type: number
 *                 example: 40.00
 *               VISPRICE:
 *                 type: number
 *                 example: 50.00
 *               OFFPRICE:
 *                 type: number
 *                 example: 50.00
 *               ISSPECIAL:
 *                 type: integer
 *                 example: 0
 *               STATUS:
 *                 type: string
 *                 example: A
 *               CHGREASON:
 *                 type: string
 *                 nullable: true
 *                 example: Updated menu item price
 *     responses:
 *       200:
 *         description: Menu item updated successfully
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Menu item not found
 *
 * /api/menu-items/{id}/price-readiness:
 *   get:
 *     summary: Check menu item price readiness
 *     description: Checks if a menu item has valid prices configured for a specific service date.
 *     tags:
 *       - Menu
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: serviceDate
 *         required: false
 *         schema:
 *           type: string
 *         example: "2026-06-28"
 *     responses:
 *       200:
 *         description: Price readiness checked successfully
 *       400:
 *         description: Menu item does not have valid prices for the service date
 *       404:
 *         description: Menu item not found
 */
