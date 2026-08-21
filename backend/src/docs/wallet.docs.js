/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: Digital wallet and funds management APIs
 * 
 * components:
 *   schemas:
 *     Wallet:
 *       type: object
 *       properties:
 *         WALLETID:
 *           type: integer
 *           description: The unique ID of the wallet
 *         CUSTOMERID:
 *           type: integer
 *           description: The associated customer ID
 *         BALANCE:
 *           type: number
 *           format: float
 *           description: Current balance of the wallet
 *         RESERVEDAMT:
 *           type: number
 *           format: float
 *           description: Amount currently reserved for unpaid served bookings
 *         STATUS:
 *           type: string
 *           description: Wallet status (e.g., A for Active, I for Inactive)
 * 
 *     WalletTransaction:
 *       type: object
 *       properties:
 *         TRANID:
 *           type: integer
 *         WALLETID:
 *           type: integer
 *         TRANSTYPE:
 *           type: string
 *           enum: [CREDIT, DEBIT]
 *         AMOUNT:
 *           type: number
 *           format: float
 *         BALBEFORE:
 *           type: number
 *           format: float
 *         BALAFTER:
 *           type: number
 *           format: float
 *         REMARKS:
 *           type: string
 *         CREATEDAT:
 *           type: string
 *           format: date-time
 * 
 *     WalletWithdrawal:
 *       type: object
 *       properties:
 *         WALLETWDID:
 *           type: integer
 *         WALLETID:
 *           type: integer
 *         AMOUNT:
 *           type: number
 *           format: float
 *         STATUS:
 *           type: string
 *           enum: [REQ, COM, REJ, CAN]
 *         PAYMENTMETHOD:
 *           type: string
 *         REFNO:
 *           type: string
 *         REMARKS:
 *           type: string
 */

/**
 * @swagger
 * /api/v1/wallets:
 *   post:
 *     summary: Create a new wallet
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - openAmount
 *             properties:
 *               customerId:
 *                 type: integer
 *               openAmount:
 *                 type: number
 *               remarks:
 *                 type: string
 *     responses:
 *       201:
 *         description: Wallet created successfully
 *       400:
 *         description: Bad request or wallet already exists
 */

/**
 * @swagger
 * /api/v1/wallets/topup:
 *   post:
 *     summary: Top up a wallet balance
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - amount
 *               - paymentMethod
 *             properties:
 *               customerId:
 *                 type: integer
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH]
 *               refNo:
 *                 type: string
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Top-up successful
 *       400:
 *         description: Validation or processing error
 */

/**
 * @swagger
 * /api/v1/wallets/customer/{customerId}:
 *   get:
 *     summary: Fetch wallet details for a customer
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Wallet details retrieved
 *       404:
 *         description: Wallet not found
 */

/**
 * @swagger
 * /api/v1/wallets/customer/{customerId}/transactions:
 *   get:
 *     summary: Fetch wallet transactions for a customer
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of transactions
 */

/**
 * @swagger
 * /api/v1/wallets/withdraw/request:
 *   post:
 *     summary: Request a withdrawal from the wallet
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - amount
 *             properties:
 *               customerId:
 *                 type: integer
 *               amount:
 *                 type: number
 *               remarks:
 *                 type: string
 *     responses:
 *       201:
 *         description: Withdrawal requested
 *       400:
 *         description: Validation or processing error
 */

/**
 * @swagger
 * /api/v1/wallets/withdraw/{walletWdId}/approve:
 *   post:
 *     summary: Approve a withdrawal request
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: walletWdId
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
 *               - paymentMethod
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH]
 *               refNo:
 *                 type: string
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Withdrawal approved
 *       400:
 *         description: Processing error
 */

/**
 * @swagger
 * /api/v1/wallets/withdraw/{walletWdId}/reject:
 *   post:
 *     summary: Reject a withdrawal request
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: walletWdId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Withdrawal rejected
 *       400:
 *         description: Processing error
 */

/**
 * @swagger
 * /api/v1/wallets/withdraw/requests:
 *   get:
 *     summary: List withdrawal requests
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [REQ, COM, REJ, CAN]
 *     responses:
 *       200:
 *         description: List of withdrawal requests
 */
