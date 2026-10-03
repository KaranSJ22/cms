/**
 * Abstract Payment Strategy interface
 */
export class PaymentStrategy {
    /**
     * Validates payment-specific parameters before touching the database
     */
    async validate({ amount, customer, details }) {
        throw new Error("validate() must be implemented by concrete strategy");
    }

    /**
     * Executes or verifies the payment
     * @returns {Object} { success: boolean, refNo: string, remarks: string }
     */
    async processPayment({ amount, customer, refNo, createdBy, remarks }) {
        throw new Error("processPayment() must be implemented by concrete strategy");
    }
}
