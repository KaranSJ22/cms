import * as WalkinRepository from "./walkin.repository.js";

export class WalkinService {
    /**
     * 1. Employee Lookup (Permanent, Contract, OCE)
     * Searches by EMPCODE, CONTCODE, LOGINID, or RFID Card.
     */
    static async employeeLookup(queryStr) {
        return await WalkinRepository.employeeLookup(queryStr);
    }

    /**
     * 2. Visitor Lookup
     * Searches by VISMOBILE (Phone number), VISNAME, or Visitor RFID.
     */
    static async visitorLookup(queryStr) {
        return await WalkinRepository.visitorLookup(queryStr);
    }

    /**
     * 3. Quick Register Walk-In Visitor
     * Creates Customer + Visitor + initial Wallet (₹0.00) + optional RFID in one atomic transaction.
     */
    static async registerVisitor({ VISNAME, VISMOBILE, VISORG, VISPURPOSE, KEYVALUE }, staffUserId) {
        return await WalkinRepository.registerVisitor(
            { VISNAME, VISMOBILE, VISORG, VISPURPOSE, KEYVALUE },
            staffUserId
        );
    }

    /**
     * 4. Get Today's Active Menu for Walk-In Counter
     * Returns items for today's active meal slot with rates mapped by customer type.
     */
    static async getActiveMenu(canteenId, ctypeCode = "PRM") {
        return await WalkinRepository.getActiveMenu(canteenId, ctypeCode);
    }

    /**
     * 5. Direct Atomic Walk-In Serving
     * - Permanent: No wallet deduction.
     * - Contract / Visitor: Checks and deducts wallet atomically.
     * - Directly records in CMS_BOOKING (STATUSID = 32 'SRV') and CMS_BOOKHIST.
     */
    static async serveWalkin({ customerId, canteenId, serviceId, items }, staffUserId) {
        return await WalkinRepository.serveWalkin({ customerId, canteenId, serviceId, items }, staffUserId);
    }
}
