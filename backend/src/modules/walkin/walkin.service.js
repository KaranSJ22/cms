import { pool } from "../../db/connection.js";
import { BadRequestError, NotFoundError } from "../../common/errors/appError.js";

/**
 * Helper to get auto-generated sequence number from CMSGENAUTO
 */
async function genAutoNo(conn, tableName, columnName) {
    await conn.execute(`CALL CMSGENAUTO(?, ?, @__autono)`, [tableName, columnName]);
    const [[row]] = await conn.execute(`SELECT @__autono AS AUTONO`);
    return row?.AUTONO || `REF-${Date.now()}`;
}

export class WalkinService {
    /**
     * 1. Employee Lookup (Permanent & Contract)
     * Searches by EMPCODE, CONTCODE, LOGINID, or RFID Card.
     */
    static async employeeLookup(queryStr) {
        const cleanQuery = (queryStr || "").trim();
        if (!cleanQuery) return null;

        const [rows] = await pool.query(
            `SELECT 
          c.CUSTOMERID,
          c.USERID,
          u.LOGINID,
          u.FULLNAME,
          c.DISPNAME,
          c.CTYPECODE,
          ct.CTYPENAME,
          pe.EMPCODE,
          pe.DEPT,
          pe.DESIG,
          ce.CONTCODE,
          ce.VENDORNAME,
          COALESCE(ce.DEFAULTCANTEENID, pe.DEFAULTCANTEENID) AS DEFAULTCANTEENID,
          w.WALLETID,
          COALESCE(w.BALANCE, 0.00) AS WALLETBALANCE
       FROM CMS_CUSTOMER c
       JOIN CMS_CUSTTYPE ct ON ct.CTYPECODE = c.CTYPECODE
       LEFT JOIN CMS_USER u ON u.USERID = c.USERID
       LEFT JOIN CMS_PERMEMP pe ON pe.CUSTOMERID = c.CUSTOMERID
       LEFT JOIN CMS_CONTEMP ce ON ce.CUSTOMERID = c.CUSTOMERID
       LEFT JOIN CMS_WALLET w ON w.CUSTOMERID = c.CUSTOMERID AND w.STATUSID = 10
       LEFT JOIN CMS_ACCKEY ak ON ak.CUSTOMERID = c.CUSTOMERID AND ak.STATUSID = 10
       WHERE c.STATUSID = 10
         AND c.CTYPECODE IN ('PRM', 'CNT')
         AND (
             LOWER(pe.EMPCODE) = LOWER(?)
             OR LOWER(ce.CONTCODE) = LOWER(?)
             OR LOWER(u.LOGINID) = LOWER(?)
             OR ak.KEYVALUE = ?
         )
       LIMIT 1`,
            [cleanQuery, cleanQuery, cleanQuery, cleanQuery]
        );

        return rows[0] || null;
    }

    /**
     * 2. Visitor Lookup
     * Searches by VISMOBILE (Phone number), VISNAME, or Visitor RFID.
     */
    static async visitorLookup(queryStr) {
        const cleanQuery = (queryStr || "").trim();
        if (!cleanQuery) return [];

        const [rows] = await pool.query(
            `SELECT 
          c.CUSTOMERID,
          c.DISPNAME,
          c.CTYPECODE,
          v.VISNAME,
          v.VISMOBILE,
          v.VISORG,
          v.VISPURPOSE,
          w.WALLETID,
          COALESCE(w.BALANCE, 0.00) AS WALLETBALANCE,
          ak.KEYVALUE AS RFID
       FROM CMS_CUSTOMER c
       JOIN CMS_VISITOR v ON v.CUSTOMERID = c.CUSTOMERID
       LEFT JOIN CMS_WALLET w ON w.CUSTOMERID = c.CUSTOMERID AND w.STATUSID = 10
       LEFT JOIN CMS_ACCKEY ak ON ak.CUSTOMERID = c.CUSTOMERID AND ak.STATUSID = 10
       WHERE c.STATUSID = 10
         AND (
             v.VISMOBILE = ? 
             OR LOWER(v.VISNAME) LIKE LOWER(CONCAT('%', ?, '%'))
             OR ak.KEYVALUE = ?
         )
       LIMIT 10`,
            [cleanQuery, cleanQuery, cleanQuery]
        );

        return rows;
    }

    /**
     * 3. Quick Register Walk-In Visitor
     * Creates Customer + Visitor + initial Wallet (₹0.00) + optional RFID in one atomic transaction.
     */
    static async registerVisitor({ VISNAME, VISMOBILE, VISORG, VISPURPOSE, KEYVALUE }, staffUserId) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // A. Create Customer Record
            const [custResult] = await conn.query(
                `INSERT INTO CMS_CUSTOMER (USERID, CTYPECODE, DISPNAME, STATUSID, VALIDFROM, VALIDUNTIL)
         VALUES (NULL, 'VIS', TRIM(?), 10, CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 DAY))`,
                [VISNAME]
            );
            const customerId = custResult.insertId;

            // B. Create Visitor Record
            await conn.query(
                `INSERT INTO CMS_VISITOR (CUSTOMERID, VISNAME, VISMOBILE, VISORG, VISPURPOSE, VISDATE, VALIDUNTIL, CREATEDBY, STATUSID)
         VALUES (?, TRIM(?), ?, ?, ?, CURDATE(), DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 DAY), ?, 10)`,
                [customerId, VISNAME, VISMOBILE, VISORG || null, VISPURPOSE || "Walk-In Visit", staffUserId]
            );

            // C. Initialize Wallet (₹0.00)
            const [walletResult] = await conn.query(
                `INSERT INTO CMS_WALLET (CUSTOMERID, BALANCE, RESERVEDAMT, STATUSID)
         VALUES (?, 0.00, 0.00, 10)`,
                [customerId]
            );
            const walletId = walletResult.insertId;

            // D. Optional: Attach RFID pass if given at security gate
            if (KEYVALUE && KEYVALUE.trim()) {
                await conn.query(
                    `INSERT INTO CMS_ACCKEY (CUSTOMERID, KEYTYPE, KEYVALUE, EXPIRESAT, STATUSID, CREATEDBY)
           VALUES (?, 'VISPASS', TRIM(?), DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 DAY), 10, ?)`,
                    [customerId, KEYVALUE.trim(), staffUserId]
                );
            }

            await conn.commit();

            return {
                CUSTOMERID: customerId,
                WALLETID: walletId,
                WALLETBALANCE: 0.0,
                DISPNAME: VISNAME,
                VISNAME,
                VISMOBILE,
                VISORG,
                CTYPECODE: "VIS",
            };
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    /**
     * 4. Get Today's Active Menu for Walk-In Counter
     * Returns items for today's active meal slot with rates mapped by customer type.
     */
    static async getActiveMenu(canteenId, ctypeCode = "PRM") {
        const [rows] = await pool.query(
            `SELECT 
          dm.DAYMENUID,
          dm.DAYSLOTID,
          ds.SERVICEID,
          s.SERVCODE,
          s.SERVNAME,
          ds.STARTTIME,
          ds.ENDTIME,
          mi.MENUITEMID,
          mi.ITEMNAME,
          mi.SHORTNAME,
          dm.ISBASE,
          dm.ISSPECIAL,
          COALESCE((
              SELECT d.PRICE
              FROM CMS_ITEMPRICE p
              JOIN CMS_STATUS ip_st ON ip_st.STATUSID = p.STATUSID AND ip_st.STATUSCODE = 'ACT'
              JOIN CMS_ITEMPRICEDT d ON d.ITEMPRICEID = p.ITEMPRICEID
              WHERE p.MENUITEMID = dm.MENUITEMID
                AND d.CTYPECODE = ?
                AND p.EFFFROM <= CURDATE()
              ORDER BY p.EFFFROM DESC 
              LIMIT 1
          ), 0.00) AS PRICE
       FROM CMS_DAYSLOT ds
       JOIN CMS_DAYMENU dm ON dm.DAYSLOTID = ds.DAYSLOTID
       JOIN CMS_MENUITEM mi ON mi.MENUITEMID = dm.MENUITEMID
       JOIN CMS_SERVICE s ON s.SERVICEID = ds.SERVICEID
       JOIN CMS_STATUS dm_st ON dm_st.STATUSID = dm.STATUSID AND dm_st.STATUSCODE = 'ACT'
       JOIN CMS_STATUS mi_st ON mi_st.STATUSID = mi.STATUSID AND mi_st.STATUSCODE = 'ACT'
       WHERE ds.CANTEENID = ?
         AND ds.SERVDATE = CURDATE()
         AND ds.STATUSID = 10
         AND ds.APPRSTATUSID = 22 
       ORDER BY dm.ISBASE DESC, mi.ITEMNAME ASC`,
            [ctypeCode, canteenId]
        );

        return rows;
    }

    /**
     * 5. Direct Atomic Walk-In Serving
     * - Permanent: No wallet deduction.
     * - Contract / Visitor: Checks and deducts wallet atomically.
     * - Directly records in CMS_BOOKING (STATUSID = 32 'SRV') and CMS_BOOKHIST.
     */
    static async serveWalkin({ customerId, canteenId, serviceId, items }, staffUserId) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // A. Verify Customer
            const [[customer]] = await conn.query(
                `SELECT CUSTOMERID, CTYPECODE, DISPNAME FROM CMS_CUSTOMER WHERE CUSTOMERID = ? AND STATUSID = 10`,
                [customerId]
            );
            if (!customer) {
                throw new NotFoundError("Customer not found or inactive");
            }

            // B. Resolve Item Details & Rates
            const dayMenuIds = items.map((i) => i.dayMenuId);
            const [menuItems] = await conn.query(
                `SELECT 
            dm.DAYMENUID, 
            dm.MENUITEMID, 
            mi.ITEMNAME,
            COALESCE((
              SELECT d.PRICE
              FROM CMS_ITEMPRICE p
              JOIN CMS_STATUS ip_st ON ip_st.STATUSID = p.STATUSID AND ip_st.STATUSCODE = 'ACT'
              JOIN CMS_ITEMPRICEDT d ON d.ITEMPRICEID = p.ITEMPRICEID
              WHERE p.MENUITEMID = dm.MENUITEMID
                AND d.CTYPECODE = ?
                AND p.EFFFROM <= CURDATE()
              ORDER BY p.EFFFROM DESC 
              LIMIT 1
            ), 0.00) AS PRICE
         FROM CMS_DAYMENU dm
         JOIN CMS_MENUITEM mi ON mi.MENUITEMID = dm.MENUITEMID
         WHERE dm.DAYMENUID IN (?)`,
                [customer.CTYPECODE, dayMenuIds]
            );

            const itemMap = new Map(menuItems.map((m) => [m.DAYMENUID, m]));
            let totalAmount = 0.0;
            let totalQty = 0;
            const preparedItems = [];

            for (const reqItem of items) {
                const found = itemMap.get(reqItem.dayMenuId);
                if (!found) {
                    throw new BadRequestError(`Invalid or unavailable menu item ID: ${reqItem.dayMenuId}`);
                }
                const qty = Number(reqItem.qty) || 1;
                const rate = Number(found.PRICE);
                const amount = Number((qty * rate).toFixed(2));

                totalQty += qty;
                totalAmount += amount;
                preparedItems.push({
                    dayMenuId: found.DAYMENUID,
                    menuItemId: found.MENUITEMID,
                    itemName: found.ITEMNAME,
                    qty,
                    rate,
                    amount,
                });
            }
            totalAmount = Number(totalAmount.toFixed(2));

            // C. Handle Payment Check & Deduction (Contract & Visitor only)
            let walletId = null;
            let balBefore = 0.0;
            let balAfter = 0.0;
            const isWalletCustomer = ["CNT", "VIS", "CONTEMP", "VISITOR"].includes(customer.CTYPECODE);

            if (isWalletCustomer) {
                const [[wallet]] = await conn.query(
                    `SELECT WALLETID, BALANCE FROM CMS_WALLET WHERE CUSTOMERID = ? AND STATUSID = 10 FOR UPDATE`,
                    [customerId]
                );
                if (!wallet) {
                    throw new BadRequestError("Active wallet not found for customer");
                }
                balBefore = Number(wallet.BALANCE);
                if (totalAmount > balBefore) {
                    throw new BadRequestError(
                        `Insufficient wallet balance. Total: ₹${totalAmount.toFixed(2)}, Available: ₹${balBefore.toFixed(2)}`
                    );
                }
                balAfter = Number((balBefore - totalAmount).toFixed(2));
                walletId = wallet.WALLETID;

                // Deduct from wallet
                await conn.query(`UPDATE CMS_WALLET SET BALANCE = ? WHERE WALLETID = ?`, [balAfter, walletId]);
            }

            // D. Generate Sequence Number (CMS_BOOKCTR for BOOKTYPEID = 3)
            await conn.query(
                `INSERT INTO CMS_BOOKCTR (BOOKTYPEID, SERVICEID, LASTNO)
         VALUES (3, ?, 0)
         ON DUPLICATE KEY UPDATE LASTNO = LASTNO`,
                [serviceId]
            );

            const [[ctr]] = await conn.query(
                `SELECT LASTNO FROM CMS_BOOKCTR WHERE BOOKTYPEID = 3 AND SERVICEID = ? FOR UPDATE`,
                [serviceId]
            );
            const bookSeq = (ctr?.LASTNO || 0) + 1;
            await conn.query(`UPDATE CMS_BOOKCTR SET LASTNO = ? WHERE BOOKTYPEID = 3 AND SERVICEID = ?`, [
                bookSeq,
                serviceId,
            ]);

            const [[serv]] = await conn.query(`SELECT SERVCODE FROM CMS_SERVICE WHERE SERVICEID = ?`, [serviceId]);
            const servPfx = (serv?.SERVCODE || "SRV").substring(0, 3).toUpperCase();
            const bookNo = `WI-${servPfx}${String(bookSeq).padStart(3, "0")}`;

            // E. Insert Booking directly as 'SRV' (32)
            const [bookResult] = await conn.query(
                `INSERT INTO CMS_BOOKING (
           BOOKNO, BOOKTYPEID, CUSTOMERID, SERVICEID, SERVICEDATE, STATUSID,
           BOOKSEQNO, TOTALITEMS, TOTALQTY, TOTALAMOUNT,
           BOOKEDBY, BOOKEDON, SERVEDBY, SERVEDON, REMARKS, CREATEDBY
         ) VALUES (
           ?, 3, ?, ?, CURDATE(), 32,
           ?, ?, ?, ?,
           ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP, 'Counter Walk-In Served', ?
         )`,
                [
                    bookNo,
                    customerId,
                    serviceId,
                    bookSeq,
                    preparedItems.length,
                    totalQty,
                    totalAmount,
                    staffUserId,
                    staffUserId,
                    staffUserId,
                ]
            );
            const bookingId = bookResult.insertId;

            // F. Insert Items as 'SRV' (32)
            for (const item of preparedItems) {
                await conn.query(
                    `INSERT INTO CMS_BOOKITEM (
             BOOKID, DAYMENUID, MENUITEMID, QTY, RATE, AMOUNT, REMARKS, STATUSID
           ) VALUES (?, ?, ?, ?, ?, ?, 'Walk-In Served', 32)`,
                    [bookingId, item.dayMenuId, item.menuItemId, item.qty, item.rate, item.amount]
                );
            }

            // G. Record Wallet Ledger Entry (if wallet used)
            if (isWalletCustomer && walletId && totalAmount > 0) {
                const txnRef = await genAutoNo(conn, "CMS_WALLETTRAN", "REFNO");
                await conn.query(
                    `INSERT INTO CMS_WALLETTRAN (
             WALLETID, BOOKINGID, CANTEENID, TRANSTYPE, SOURCECODE,
             AMOUNT, BALBEFORE, BALAFTER, PAYMENTMETHOD, REFNO, STATUSID, CREATEDBY, REMARKS
           ) VALUES (
             ?, ?, ?, 'DEBIT', 'BOOKING',
             ?, ?, ?, 'WALLET', ?, 44, ?, 'Walk-in counter meal charge'
           )`,
                    [walletId, bookingId, canteenId, totalAmount, balBefore, balAfter, txnRef, staffUserId]
                );
            }

            // H. Immutable History Entry (CMS_BOOKHIST + CMS_BOOKITMHS)
            const [histResult] = await conn.query(
                `INSERT INTO CMS_BOOKHIST (
           BOOKID, BOOKNO, BOOKTYPEID, CUSTOMERID, SERVICEID, SERVICEDATE,
           STATUSID, BOOKSEQNO, TOTALITEMS, TOTALQTY, TOTALAMOUNT,
           BOOKEDBY, BOOKEDON, SERVEDBY, SERVEDON,
           REMARKS, CREATEDBY, CREATEDAT, CHANGEDBY, CHGREASON
         )
         SELECT 
           BOOKID, BOOKNO, BOOKTYPEID, CUSTOMERID, SERVICEID, SERVICEDATE,
           STATUSID, BOOKSEQNO, TOTALITEMS, TOTALQTY, TOTALAMOUNT,
           BOOKEDBY, BOOKEDON, SERVEDBY, SERVEDON,
           REMARKS, CREATEDBY, CREATEDAT, SERVEDBY, 'Immediate Walk-In Service'
         FROM CMS_BOOKING WHERE BOOKID = ?`,
                [bookingId]
            );
            const bookHistId = histResult.insertId;

            await conn.query(
                `INSERT INTO CMS_BOOKITMHS (
           BOOKHISTID, BOOKITEMID, DAYMENUID, MENUITEMID, QTY, RATE, AMOUNT, REMARKS, STATUSID
         )
         SELECT 
           ?, BOOKITEMID, DAYMENUID, MENUITEMID, QTY, RATE, AMOUNT, REMARKS, STATUSID
         FROM CMS_BOOKITEM WHERE BOOKID = ?`,
                [bookHistId, bookingId]
            );

            await conn.commit();

            return {
                bookingId,
                bookNo,
                statusCode: "SRV",
                statusText: "Served",
                customer: {
                    customerId: customer.CUSTOMERID,
                    dispName: customer.DISPNAME,
                    ctypeCode: customer.CTYPECODE,
                },
                totalQty,
                totalAmount,
                walletBalance: isWalletCustomer ? balAfter : null,
                items: preparedItems,
            };
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }
}
