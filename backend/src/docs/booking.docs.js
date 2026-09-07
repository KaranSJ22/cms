/**
 * @swagger
 * components:
 *   schemas:
 *     BookingItemPayload:
 *       type: object
 *       required:
 *         - DAYMENUID
 *         - QTY
 *       properties:
 *         DAYMENUID:
 *           type: integer
 *           description: ID of the day menu item to book
 *         QTY:
 *           type: integer
 *           description: Quantity to book
 *     
 *     CreateBookingPayload:
 *       type: object
 *       required:
 *         - PBOOKTYPECODE
 *         - PCUSTOMERID
 *         - PSERVICEID
 *         - PSERVICEDATE
 *         - PITEMSJSON
 *       properties:
 *         PBOOKTYPECODE:
 *           type: string
 *           enum: [PB, KS]
 *           description: Pre-booking (PB) or Kiosk booking (KS)
 *         PCUSTOMERID:
 *           type: integer
 *           description: ID of the customer
 *         PSERVICEID:
 *           type: integer
 *           description: ID of the service (Breakfast, Lunch, etc.)
 *         PSERVICEDATE:
 *           type: string
 *           format: date
 *           description: Service date (YYYY-MM-DD)
 *         PITEMSJSON:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BookingItemPayload'
 *         PREMARKS:
 *           type: string
 *           description: Optional remarks for the booking
 *           
 *     UpdateBookingItemPayload:
 *       type: object
 *       required:
 *         - PQTY
 *         - PSTATUS
 *       properties:
 *         PQTY:
 *           type: integer
 *           description: Updated quantity
 *         PSTATUS:
 *           type: string
 *           enum: [CR, SRV, CAN, NOS]
 *           description: Booking status (Created, Served, Cancelled, No-Show)
 *         PCHGREASON:
 *           type: string
 *           description: Reason for change
 *           
 *     CancelBookingPayload:
 *       type: object
 *       properties:
 *         PCANCELREASON:
 *           type: string
 *           description: Reason for cancellation
 *           
 *     ServeBookingPayload:
 *       type: object
 *       properties:
 *         PSERVEREASON:
 *           type: string
 *           description: Optional remarks/reason for serving
 *           
 *     ToggleKioskPayload:
 *       type: object
 *       required:
 *         - PISKIOSK
 *       properties:
 *         PISKIOSK:
 *           type: integer
 *           enum: [0, 1]
 *           description: 1 to enable kiosk, 0 to disable
 */

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Retrieve a list of bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: PCUSTOMERID
 *         schema:
 *           type: integer
 *         description: Filter by customer ID
 *       - in: query
 *         name: PSERVICEID
 *         schema:
 *           type: integer
 *         description: Filter by service ID
 *       - in: query
 *         name: PSTARTDATE
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: PENDDATE
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (YYYY-MM-DD)
 *       - in: query
 *         name: PSTATUS
 *         schema:
 *           type: string
 *         description: Filter by booking status (e.g. CR, SRV)
 *     responses:
 *       200:
 *         description: List of bookings
 * 
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBookingPayload'
 *     responses:
 *       201:
 *         description: Booking created successfully
 */

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get a specific booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The booking ID
 *     responses:
 *       200:
 *         description: Booking details including items
 *       404:
 *         description: Booking not found
 */

/**
 * @swagger
 * /api/bookings/{id}/items/{itemId}:
 *   put:
 *     summary: Update a specific booking item
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateBookingItemPayload'
 *     responses:
 *       200:
 *         description: Booking item updated successfully
 */

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   patch:
 *     summary: Cancel a booking
 *     tags: [Bookings]
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
 *             $ref: '#/components/schemas/CancelBookingPayload'
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 */

/**
 * @swagger
 * /api/bookings/{id}/serve:
 *   patch:
 *     summary: Serve a booking
 *     tags: [Bookings]
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
 *             $ref: '#/components/schemas/ServeBookingPayload'
 *     responses:
 *       200:
 *         description: Booking served successfully
 */

/**
 * @swagger
 * /api/bookings/{id}/no-show:
 *   patch:
 *     summary: Mark a booking as no-show
 *     tags: [Bookings]
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
 *             $ref: '#/components/schemas/CancelBookingPayload'
 *     responses:
 *       200:
 *         description: Booking marked as no-show successfully
 */

/**
 * @swagger
 * /api/bookings/kiosk-toggle/{dayMenuId}:
 *   patch:
 *     summary: Toggle Kiosk availability for a day menu
 *     tags: [Bookings, DayMenu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dayMenuId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ToggleKioskPayload'
 *     responses:
 *       200:
 *         description: Kiosk toggled successfully
 */
