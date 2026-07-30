/**
 * @swagger
 * /api/me:
 *   get:
 *     summary: Get authenticated user from JWT
 *     tags:
 *       - Identity
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user details
 *       401:
 *         description: Authentication token missing or invalid
 */

/**
 * @swagger
 * /api/identity/users:
 *   get:
 *     summary: Get all users
 *     description: Admin-only API to fetch CMS users.
 *     tags:
 *       - Identity
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users fetched successfully
 *       403:
 *         description: Permission denied
 *
 *   post:
 *     summary: Create user
 *     description: Admin-only API to create a CMS login user. Password is hashed before storing.
 *     tags:
 *       - Identity
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - LOGINID
 *               - FULLNAME
 *               - PASSWORD
 *             properties:
 *               LOGINID:
 *                 type: string
 *                 example: TEST002
 *               FULLNAME:
 *                 type: string
 *                 example: Test User Two
 *               EMAIL:
 *                 type: string
 *                 example: test2.user@isro.gov.in
 *               MOBILENO:
 *                 type: string
 *                 example: "9876543211"
 *               PASSWORD:
 *                 type: string
 *                 example: Test@123
 *               AUTHPROV:
 *                 type: string
 *                 example: LOCAL
 *     responses:
 *       201:
 *         description: User created successfully
 *       409:
 *         description: LOGINID already exists
 */

/**
 * @swagger
 * /api/identity/roles:
 *   get:
 *     summary: Get all roles
 *     tags:
 *       - Identity
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roles fetched successfully
 */

/**
 * @swagger
 * /api/identity/user-roles:
 *   post:
 *     summary: Assign role to user
 *     description: Admin-only API to assign a system role to a user.
 *     tags:
 *       - Identity
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - USERID
 *               - ROLEID
 *             properties:
 *               USERID:
 *                 type: integer
 *                 example: 7
 *               ROLEID:
 *                 type: integer
 *                 example: 4
 *               VALIDFROM:
 *                 type: string
 *                 nullable: true
 *                 example: null
 *               VALIDUNTIL:
 *                 type: string
 *                 nullable: true
 *                 example: null
 *     responses:
 *       201:
 *         description: Role assigned successfully
 */

/**
 * @swagger
 * /api/identity/customers:
 *   get:
 *     summary: Get all customers
 *     tags:
 *       - Identity
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customers fetched successfully
 *
 *   post:
 *     summary: Create customer profile
 *     description: Admin-only API to create a canteen customer identity linked to a user when applicable.
 *     tags:
 *       - Identity
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - CTYPECODE
 *               - DISPNAME
 *             properties:
 *               USERID:
 *                 type: integer
 *                 nullable: true
 *                 example: 7
 *               CTYPECODE:
 *                 type: string
 *                 example: PERMANENT
 *               DISPNAME:
 *                 type: string
 *                 example: Test User
 *               STATUS:
 *                 type: string
 *                 example: A
 *               VALIDFROM:
 *                 type: string
 *                 nullable: true
 *                 example: null
 *               VALIDUNTIL:
 *                 type: string
 *                 nullable: true
 *                 example: null
 *     responses:
 *       201:
 *         description: Customer created successfully
 */

// /**
//  * @swagger
//  * /api/identity/approval-levels:
//  *   get:
//  *     summary: Get approval levels
//  *     tags:
//  *       - Identity
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Approval levels fetched successfully
//  */

// /**
//  * @swagger
//  * /api/identity/permanent-employees:
//  *   post:
//  *     summary: Create permanent employee profile
//  *     description: Admin-only API to create permanent employee-specific profile for a PERMANENT customer.
//  *     tags:
//  *       - Identity
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - CUSTOMERID
//  *               - EMPCODE
//  *               - DEPT
//  *               - DESIG
//  *             properties:
//  *               CUSTOMERID:
//  *                 type: integer
//  *                 example: 6
//  *               EMPCODE:
//  *                 type: string
//  *                 example: EMPTEST001
//  *               DEPT:
//  *                 type: string
//  *                 example: IT Department
//  *               DESIG:
//  *                 type: string
//  *                 example: Assistant Engineer
//  *     responses:
//  *       201:
//  *         description: Permanent employee profile created successfully
//  */