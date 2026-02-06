// module imports
// import braintree from "braintree";

// file imports
import { ENVIRONMENTS, ENVIRONMENT_VARIABLES } from "../configs/enum";
import { requireEnv } from "../configs/helper";

// destructuring assignments
const { PRODUCTION } = ENVIRONMENTS;

class BraintreeManager {
  private static instance: BraintreeManager;

  // private readonly gateway = new braintree.BraintreeGateway({
  //   environment:
  //     requireEnv(ENVIRONMENT_VARIABLES.NODE_ENV) === PRODUCTION
  //       ? braintree.Environment.Production
  //       : braintree.Environment.Sandbox,
  //   merchantId: requireEnv(ENVIRONMENT_VARIABLES.BRAINTREE_MERCHANT_ID),
  //   publicKey: requireEnv(ENVIRONMENT_VARIABLES.BRAINTREE_PUBLIC_KEY),
  //   privateKey: requireEnv(ENVIRONMENT_VARIABLES.BRAINTREE_PRIVATE_KEY),
  // });

  constructor() {
    if (!BraintreeManager.instance) {
      BraintreeManager.instance = this;
    }
    return BraintreeManager.instance;
  }

  /**
   * @description Generate a client token
   * @param {string} customerId OPTIONAL braintree customer id
   * @returns {Object} client token
   */
  async generateClientToken(customerId: string) {
    // return await this.gateway.clientToken.generate({ customerId });
  }

  /**
   * @description Create a braintree customer account
   * @param {string} firstName first name
   * @param {string} lastName last name
   * @param {string} email email address
   * @param {string} phone phone number
   * @param {Object} creditCard credit card data
   * @param {string} paymentMethodNonce nonce token
   * @returns {Object} paymentAccount
   */
  async createCustomer(params: any) {
    const {
      firstName,
      lastName,
      email,
      phone,
      creditCard,
      paymentMethodNonce,
    } = params;
    const customerObj = {
      firstName,
      lastName,
      email,
      phone,
      creditCard,
      paymentMethodNonce,
    };
    // return await this.gateway.customer.create(customerObj);
  }

  /**
   * @description Delete a customer
   * @param {string} customerId braintree customer id
   * @returns {Object} customer data
   */
  async deleteCustomer(customerId: string) {
    // return await this.gateway.customer.delete(customerId);
  }

  /**
   * @description Create a braintree payment method
   * @param {Object} customerId braintree customer id
   * @param {string} paymentMethodNonce nonce token
   * @returns {Object} paymentMethod
   */
  async createPaymentMethod(params: any) {
    const { customerId, paymentMethodNonce } = params;
    const paymentMethodObj = { customerId, paymentMethodNonce };
    // return await this.gateway.paymentMethod.create(paymentMethodObj);
  }

  /**
   * @description Remove a payment method
   * @param {string} token payment method token
   * @returns {Object} payment method data
   */
  async removePaymentMethod(token: string) {
    // return await this.gateway.paymentMethod.delete(token);
  }

  /**
   * @description Create a transaction
   * @param {number} amount transaction amount in smaller units of currency
   * @param {string} customerId braintree customer id
   * @param {string} paymentMethodNonce nonce token
   * @param {string} paymentMethodToken method token
   * @param {string} deviceData OPTIONAL device data
   * @returns {Object} transaction
   */
  async saleTransaction(params: any) {
    const {
      amount,
      customerId,
      paymentMethodNonce,
      paymentMethodToken,
      deviceData,
    } = params;

    const transactionObj = {
      amount: Number(amount).toFixed(2),
      customerId,
      paymentMethodToken,
      paymentMethodNonce,
      deviceData,
      options: {
        submitForSettlement: false,
      },
    };
    // return await this.gateway.transaction.sale(transactionObj);
  }

  /**
   * @description Submit transaction for settlement
   * @param {string} transactionId braintree transaction id
   * @param {number} amount transaction amount in smaller units of currency
   * @returns {Object} transaction
   */
  async adjustTransaction(params: any) {
    const { transactionId, amount } = params;
    // return await this.gateway.transaction.adjustAuthorization(transactionId, {
    //   amount,
    // });
  }

  /**
   * @description Adjust authorized transaction
   * @param {string} transactionId braintree transaction id
   * @returns {Object} transaction
   */
  async submitTransaction(transactionId: string) {
    // return await this.gateway.transaction.submitForSettlement(transactionId);
  }

  /**
   * @description Void a transaction
   * @param {string} transactionId braintree transaction id
   * @returns {Object} transaction
   */
  async voidTransaction(transactionId: string) {
    // return await this.gateway.transaction.void(transactionId);
  }

  /**
   * @description Hold a transaction
   * @param {string} transactionId braintree transaction id
   * @returns {Object} transaction hold data
   */
  async holdTransaction(transactionId: string) {
    // return await this.gateway.transaction.holdInEscrow(transactionId);
  }

  /**
   * @description Refund a transaction
   * @param {string} transactionId braintree transaction id
   * @returns {Object} transaction refund data
   */
  async refundTransaction(transactionId: string) {
    // return await this.gateway.transaction.refund(transactionId);
  }

  /**
   * @description Release a transaction
   * @param {string} transactionId braintree transaction id
   * @returns {Object} transaction refund data
   */
  async releaseTransaction(transactionId: string) {
    // return await this.gateway.transaction.releaseFromEscrow(transactionId);
  }
}

export default new BraintreeManager();
// Object.freeze(new BraintreeManager());
