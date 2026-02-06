// module imports
// import Stripe from "stripe";

// file imports
import * as paymentAccountController from "../modules/payment-account/controller";
import * as userController from "../modules/user/controller";
import { ENVIRONMENT_VARIABLES, PAYMENT_ACCOUNT_TYPES } from "../configs/enum";
import { requireEnv } from "../configs/helper";

class StripeManager {
  private static instance: StripeManager;

  private readonly currency = "usd";
  private readonly stripeSecretKey = requireEnv(
    ENVIRONMENT_VARIABLES.STRIPE_SECRET_KEY,
  );
  private readonly stripeEndpointSecret = requireEnv(
    ENVIRONMENT_VARIABLES.STRIPE_ENDPOINT_SECRET,
  );
  // private readonly stripe = new Stripe(this.stripeSecretKey);

  constructor() {
    if (!StripeManager.instance) {
      StripeManager.instance = this;
    }
    return StripeManager.instance;
  }

  /**
   * @description Create stripe token
   * @param {string} number card number
   * @param {string} expMonth expiry month
   * @param {string} expYear expiry year
   * @param {string} cvc card cvc
   * @param {string} name user name
   * @returns {Object} stripe token
   */
  async createToken(params: any) {
    const { number, expMonth, expYear, cvc, name } = params;
    const card: any = {};
    if (number) card.number = number;
    if (typeof expMonth === "number") card.expMonth = expMonth;
    if (typeof expYear === "number") card.expYear = expYear;
    if (cvc) card.cvc = cvc;
    if (name) card.name = name;
    // return await this.stripe.tokens.create({ card });
  }

  /**
   * @description Delete stripe customer
   * @param {string} customerId stripe customer id
   * @returns {Object} stripe customer deletion response
   */
  async deleteCustomer(customerId: string) {
    // return await this.stripe.customers.del(customerId);
  }

  /**
   * @description Delete stripe customers
   * @returns {Object} stripe customers deletion response
   */
  async deleteAllCustomers() {
    // const customersObj = await this.stripe.customers.list({ limit: 500 });
    // const customers = customersObj.data;
    // for (let index = 0; index < customers.length; index++) {
    //   const element = customers[index];
    //   try {
    //     this.deleteCustomer(element.id);
    //   } catch (e) {
    //     console.log("e =>", e);
    //   }
    // }
  }

  /**
   * @description Create stripe customers
   * @returns {Object} stripe customers creation response
   */
  async createAllCustomers() {
    const query: any = { limit: Math.pow(2, 32) };
    const { data: users } = await userController.getUsers(query);
    for (let index = 0; index < users.length; index++) {
      const element = users[index];
      const id = "";
      await this.createCustomer({
        id: element?._id.toString(),
        email: element?.email,
      });
    }
  }

  /**
   * @description Refund stripe charge
   * @param {string} charge stripe charge id
   * @returns {Object} stripe charge refund response
   */
  async createRefund(charge: string) {
    // return await this.stripe.refunds.create({ charge });
  }

  /**
   * @description Create stripe charge
   * @param {string} customer stripe customer id
   * @param {string} amount charge amount in currency smallest unit
   * @param {string} currency amount currency e.g "usd"
   * @param {string} source stripe source token
   * @param {string} description charge description
   * @returns {Object} stripe charge response
   */
  async createCharge(params: any) {
    const { customer, amount, currency, source, description } = params;
    const chargeObj = {
      currency: currency ?? this.currency,
      customer,
      amount,
      source,
      description,
    };

    // return await this.stripe.charges.create(chargeObj);
  }

  /**
   * @description Create stripe customer source with customer existence check
   * @param {string} source stripe source token
   * @param {string} cardHolderName user card title
   * @param {string} user user id
   * @param {string} email OPTIONAL user email address
   * @returns {Object} paymentAccount
   */
  async createCustomerSourceWithCheck(params: any) {
    const { source, cardHolderName, user, email, phone } = params;

    const paymentAccountExists =
      await paymentAccountController.getPaymentAccount({ user });

    let userStripeId;

    if (paymentAccountExists)
      userStripeId = paymentAccountExists.account.stripeId;
    else {
      const customerObj: any = {};
      if (email) customerObj.email = email;
      if (phone) customerObj.phone = phone;
      // const customer = await this.stripe.customers.create(customerObj);
      // userStripeId = customer?.id;
    }
    // const card = await this.stripe.customers.createSource(userStripeId, {
    //   source,
    // });

    // card.cardHolderName = cardHolderName;
    // const paymentAccountObj = {
    //   user,
    //   type: PAYMENT_ACCOUNT_TYPES.STRIPE_CUSTOMER,
    //   account: card,
    // };
    // const paymentAccount = await paymentAccountController.addPaymentAccount(
    //   paymentAccountObj
    // );
    // return paymentAccount;
  }

  /**
   * @description Create stripe customer
   * @param {string} id OPTIONAL user id
   * @param {string} email OPTIONAL user email address
   * @param {string} phone OPTIONAL user phone number
   * @returns {Object} stripe customer data
   */
  async createCustomer(params: any) {
    const { id, email, phone } = params;
    const customerObj = { id, email, phone };
    // return await this.stripe.customers.create(customerObj);
  }

  /**
   * @description Create stripe express account with account existence check
   * @param {string} user user id
   * @param {string} email user email address
   * @returns {Object} paymentAccount
   */
  async createAccountWithCheck(params: any) {
    const { user, email } = params;
    const paymentAccountExists =
      await paymentAccountController.getPaymentAccount({ user });

    if (paymentAccountExists) return paymentAccountExists;
    else {
      // const account = await this.stripe.accounts.create({
      //   email,
      //   type: "express",
      //   capabilities: {
      //     card_payments: {
      //       requested: true,
      //     },
      //     transfers: {
      //       requested: true,
      //     },
      //   },
      // });
      // const paymentAccountObj = {
      //   user,
      //   type: PAYMENT_ACCOUNT_TYPES.STRIPE_ACCOUNT,
      //   account,
      // };
      // const paymentAccount = await paymentAccountController.addPaymentAccount(
      //   paymentAccountObj
      // );
      // return paymentAccount;
    }
  }

  /**
   * @description Create stripe account sign up link
   * @param {string} account stripe account id
   * @param {string} refreshUrl redirect url for link expiration or invalidity
   * @param {string} returnUrl redirect url for completion or incompletion linked flow
   * @returns {Object} stripe account link
   */
  async createAccountLink(params: any) {
    const { account, refreshURL, returnURL, email, user } = params;

    const paymentAccountExists =
      await paymentAccountController.getPaymentAccount({ user });

    let accountObj;
    if (paymentAccountExists) accountObj = paymentAccountExists.account;
    else {
      // accountObj = await this.stripe.accounts.create({
      //   type: "custom",
      //   country: "US",
      //   email,
      //   capabilities: {
      //     card_payments: { requested: true },
      //     transfers: { requested: true },
      //   },
      // });
      const paymentAccountObj = {
        user,
        account: accountObj,
        type: PAYMENT_ACCOUNT_TYPES.STRIPE_CUSTOMER,
      };
      await paymentAccountController.addPaymentAccount(paymentAccountObj);
    }
    const accountLinkObj = {
      account: account ?? accountObj.id,
      refresh_url: refreshURL ?? "https://app.page.link/stripefailed",
      return_url: returnURL ?? "https://app.page.link/stripesuccess",
      type: "account_onboarding",
    };
    // return await this.stripe.accountLinks.create(accountLinkObj);
  }

  /**
   * @description Create stripe topUp
   * @param {string} amount topUp amount in smaller units of currency
   * @param {string} currency amount currency e.g "usd"
   * @param {string} description OPTIONAL topUp description
   * @param {string} statementDescriptor OPTIONAL statement description e.g "Top-up"
   * @returns {Object} stripe topUp response
   */
  async createTopUp(params: any) {
    const { amount, currency, description, statementDescriptor } = params;
    const topUpObj = {
      amount,
      currency: currency ?? this.currency,
      description,
      statementDescriptor,
    };
    // return await this.stripe.topUps.create(topUpObj);
  }

  /**
   * @description Create stripe transfer
   * @param {string} user user id
   * @param {string} amount transfer amount in smaller units of currency
   * @param {string} currency amount currency e.g "usd"
   * @param {string} destination destination stripe account
   * @param {string} description OPTIONAL transfer description
   * @returns {Object} stripe transfer response
   */
  async createTransfer(params: any) {
    const { user, amount, currency, description } = params;
    const paymentAccountExists =
      await paymentAccountController.getPaymentAccount({ user });
    const transferObj = {
      amount,
      currency: currency ?? this.currency,
      destination: paymentAccountExists?.account?._id,
      description,
    };
    if (paymentAccountExists)
      transferObj.destination = paymentAccountExists.account.id;

    // return await this.stripe.transfers.create(transferObj);
  }

  /**
   * Create stripe payment intent
   * @param {string} customer customer id
   * @param {string} amount payment amount
   * @param {string} currency payment currency
   * @param {[String]} payment_method_types payment method types
   * @returns {Object} stripe payment intent object
   */
  async createPaymentIntent(params: any) {
    const { amount, currency, paymentMethod, customer } = params;

    const paymentIntentObj: any = {
      amount: Number(amount * 100).toFixed(0),
      currency: currency ?? "usd",
      customer,
      capture_method: "manual", // authorize now, capture later
      setup_future_usage: "on_session", // saves for future use
    };

    if (paymentMethod) {
      // Immediate confirmation with provided payment method
      paymentIntentObj.payment_method = paymentMethod;
      paymentIntentObj.confirm = true;
      paymentIntentObj.payment_method_types = ["card"];
    } else {
      // No payment method yet; client will confirm via PaymentSheet
      paymentIntentObj.automatic_payment_methods = {
        enabled: true,
        allow_redirects: "never", // to avoid redirect errors
      };
    }

    // return await this.stripe.paymentIntents.create(paymentIntentObj);
  }

  /**
   * Capture payment intent
   * @param {string} paymentIntent payment intent id
   * @param {string} amount payment amount
   * @returns {Object} capture payment intent object
   */
  async capturePaymentIntent(params: any) {
    const { paymentIntent, amount } = params;
    const captureObj: any = {};
    if (amount) {
      captureObj.amount_to_capture = Math.round(Number(amount)) * 100;
    }
    // return await this.stripe.paymentIntents.capture(paymentIntent, captureObj);
  }

  /**
   * Cancel payment intent
   * @param {string} paymentIntent payment intent id
   * @returns {Object} cancel payment intent object
   */
  async cancelPaymentIntent(paymentIntent: string) {
    // return await this.stripe.paymentIntents.cancel(paymentIntent);
  }

  /**
   * Refund payment intent
   * @param {string} paymentIntent payment intent id
   * @returns {Object} refund payment intent object
   */
  async refundPaymentIntent(paymentIntent: string) {
    // return await this.stripe.refunds.create({ payment_intent: paymentIntent });
  }

  /**
   * Get customer sources
   * @param {string} customer customer id
   * @returns {[object]} stripe customer sources
   */
  async getCustomerSources(params: any) {
    const { customer, limit, startingAfter, endingBefore } = params;
    // return await this.stripe.paymentMethods.list({
    //   customer,
    //   type: "card",
    //   limit,
    //   starting_after: startingAfter,
    //   ending_before: endingBefore,
    // });
  }

  /**
   * @description Construct stripe webhook event
   * @param {string} rawBody body from stripe request
   * @param {string} signature stripe signature from request headers
   * @returns {Object} stripe webhook event
   */
  async constructWebhooksEvent(params: any) {
    const { rawBody, signature } = params;

    // const event = this.stripe.webhooks.constructEvent(
    //   rawBody,
    //   signature,
    //   STRIPE_ENDPOINT_SECRET || ""
    // );

    // console.log("EVENT_TYPE: ", event.type);

    // if (event.type === "account.external_account.created") {
    //   const bodyJSON = JSON.parse(rawBody);
    //   const paymentAccountExists = await paymentAccountController.getElement({
    //     key: "account.id",
    //     value: bodyJSON.account,
    //   });
    //   await userController.updateElementById(
    //     paymentAccountExists?.user as any,
    //     { isStripeConnected: true } as any
    //   );
    // }
    // return event;
  }
}

export default new StripeManager();
// Object.freeze(new StripeManager());
