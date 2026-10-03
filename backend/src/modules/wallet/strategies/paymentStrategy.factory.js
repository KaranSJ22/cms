import { CashPaymentStrategy } from "./cash.strategy.js";
import { UpiPaymentStrategy } from "./upi.strategy.js";
import { BadRequestError } from "../../../common/errors/appError.js";

export class PaymentStrategyFactory {
    static getStrategy(paymentMethod = "CASH") {
        const method = (paymentMethod || "CASH").toUpperCase();

        switch (method) {
            case "CASH":
                return new CashPaymentStrategy();
            case "UPI":
                return new UpiPaymentStrategy();
            default:
                throw new BadRequestError(`Unsupported payment method: ${paymentMethod}`);
        }
    }
}
