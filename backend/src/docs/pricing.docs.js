/**
 * @swagger
 * /api/pricing/menu-items/{menuItemId}:
 *   get:
 *     summary: Get price history for a menu item
 *     description: Admin or canteen manager API to fetch all historical and current prices for a specific menu item.
 *     tags:
 *       - Pricing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: menuItemId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Price history fetched successfully
 *       401:
 *         description: Authentication token missing or invalid
 *       403:
 *         description: Permission denied
 *
 *   post:
 *     summary: Create new item price
 *     description: Admin or canteen manager API to set a new price structure for a menu item.
 *     tags:
 *       - Pricing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: menuItemId
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
 *               - PERMPRICE
 *               - CONTPRICE
 *               - VISPRICE
 *               - OFFPRICE
 *             properties:
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
 *               VALIDFROM:
 *                 type: string
 *                 nullable: true
 *                 example: "2026-07-21T00:00:00.000Z"
 *               VALIDUNTIL:
 *                 type: string
 *                 nullable: true
 *                 example: null
 *     responses:
 *       201:
 *         description: Item price created successfully
 *       400:
 *         description: Validation failed
 *       403:
 *         description: Permission denied
 */

/**
 * @swagger
 * /api/pricing/menu-items/{menuItemId}/effective:
 *   get:
 *     summary: Get effective prices for a menu item
 *     description: Fetches the currently active prices for a menu item across all customer types.
 *     tags:
 *       - Pricing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: menuItemId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Effective prices fetched successfully
 *       404:
 *         description: Effective price not found
 */

/**
 * @swagger
 * /api/pricing/menu-items/{menuItemId}/effective/{customerTypeCode}:
 *   get:
 *     summary: Get effective price for a menu item and customer type
 *     description: Fetches the currently active price for a menu item tailored for a specific customer type.
 *     tags:
 *       - Pricing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: menuItemId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: path
 *         name: customerTypeCode
 *         required: true
 *         schema:
 *           type: string
 *         example: PERMANENT
 *     responses:
 *       200:
 *         description: Effective price fetched successfully
 *       404:
 *         description: Effective price not found
 */

/**
 * @swagger
 * /api/pricing/item-prices/{itemPriceId}/deactivate:
 *   patch:
 *     summary: Deactivate an item price
 *     description: Admin or canteen manager API to deactivate a specific price record.
 *     tags:
 *       - Pricing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemPriceId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Item price deactivated successfully
 *       404:
 *         description: Item price not found
 */
