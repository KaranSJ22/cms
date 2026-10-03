import { PaymentStrategy } from "./payment.strategy.js";
import { BadRequestError } from "../../../common/errors/appError.js";

export class CashPaymentStrategy extends PaymentStrategy {
    async validate({ amount }) {
        if (!amount || Number(amount) <= 0) {
            throw new BadRequestError("Cash amount must be greater than zero");
        }
        return true;
    }

    async processPayment({ refNo, remarks }) {
        return {
            success: true,
            paymentMethod: "CASH",
            refNo: refNo || null, // Will use CMSGENAUTO if null
            remarks: remarks || "Counter cash deposit",
        };
    }
}
