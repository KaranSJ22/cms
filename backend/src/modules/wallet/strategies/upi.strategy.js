import { PaymentStrategy } from "./payment.strategy.js";
import { BadRequestError } from "../../../common/errors/appError.js";

export class UpiPaymentStrategy extends PaymentStrategy {
    async validate({ amount, refNo }) {
        if (!amount || Number(amount) <= 0) {
            throw new BadRequestError("UPI top-up amount must be greater than zero");
        }
        if (!refNo || !refNo.trim()) {
            throw new BadRequestError("UPI Transaction Reference / UTR is required");
        }
        return true;
    }

    async processPayment({ refNo, remarks }) {
        // In future: integrate with bank gateway / NPCI / SBI ePay verification API
        return {
            success: true,
            paymentMethod: "UPI",
            refNo: refNo.trim(),
            remarks: remarks || "Counter UPI QR payment",
        };
    }
}
