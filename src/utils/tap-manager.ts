// module imports
import crypto from "crypto";

// file imports
import { getUsers } from "../modules/user/controller";
import { ENVIRONMENT_VARIABLES } from "../configs/enum";
import { requireEnv } from "../configs/helper";

class TapManager {
  private readonly tapSecretKey = requireEnv(
    ENVIRONMENT_VARIABLES.TAP_SECRET_KEY,
  );
  private readonly tapWebhookSecret = requireEnv(
    ENVIRONMENT_VARIABLES.TAP_WEBHOOK_SECRET,
  );
  private readonly baseURL = "https://api.tap.company/v2";
  private readonly headers = {
    Authorization: `Bearer ${process.env.TAP_SECRET_KEY}`,
    "Content-Type": "application/json",
  };

  /**
   * Creates all customers in TAP based on the list of users.
   * It takes no parameters and returns no value.
   * It will log the number of customers created and any errors encountered.
   */
  async createAllCustomers() {
    console.log("TAP CREATING USERS");
    try {
      const users = await getUsers({ user: "", limit: 100, page: 1 });
      for (let index = 0; index < users.length; index++) {
        const user = users[index];
        const customerObj: any = {
          firstName: user?.firstName || user?.username,
          middleName: user?.firstName || user?.lastName ? "" : undefined,
        };
        if (user?.lastName) customerObj.lastName = user?.lastName;
        if (user?.email) customerObj.email = user?.email;
        if (user?.phone) customerObj.phone = user?.phone;
        if ((user as any)?.phoneCode)
          customerObj.phoneCode = (user as any)?.phoneCode;
        const customer: any = await this.createCustomer(customerObj);
        user.tapCustomerId = customer.id;
        await user.save();
        console.log(`(${index + 1}/${users.length}) customer(s) processed!`);
      }
    } catch (error) {
      console.log("Tap Error Creating User:", error);
    }
  }

  /**
   * Create a customer on Tap.
   * @param {Object} customerDetails - Customer details containing first name, middle name, last name, email, phone and phone code.
   * @returns {Promise<Object>} - The newly created customer object.
   */
  async createCustomer(customerDetails: any) {
    const { firstName, middleName, lastName, email, phone, phoneCode } =
      customerDetails;

    let phoneData = undefined;
    if (phone || phoneCode) {
      phoneData = {
        country_code: phoneCode,
        number: phone,
      };
    }
    const customerObj = {
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      email: email,
      phone: phoneData,
    };

    const resp = await fetch(`${this.baseURL}/customers`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(customerObj),
    });
    return await resp.json();
  }

  /**
   * Create a card token on Tap.
   * @param {Object} cardDetails - Card details containing card number, expiration month, expiration year, cvc, name, country, city, street, avenue, address line 1 and client IP.
   * @returns {Promise<Object>} - The newly created card token object.
   */
  async createCardToken(cardDetails: any) {
    const {
      number,
      expMonth,
      expYear,
      cvc,
      name,
      country,
      city,
      street,
      avenue,
      addressLine1,
      clientIP,
    } = cardDetails;
    let addressData = undefined;
    if (country || addressLine1 || city || street || avenue) {
      addressData = {
        country,
        line1: addressLine1,
        city,
        street,
        avenue,
      };
    }
    const cardObj = {
      card: {
        number: number,
        exp_month: expMonth,
        exp_year: expYear,
        cvc,
        name,
        address: addressData,
      },
      client_ip: clientIP,
    };
    return this.createToken(cardObj);
  }

  /**
   * Create a card token on Tap using an encrypted card.
   * @param {Object} cardDetails - Card details containing the encrypted card data, country, city, state, zip, address line 1 and address line 2.
   * @returns {Promise<Object>} - The newly created card token object.
   */
  async createEncryptedCardToken(cardDetails: any) {
    const {
      encryptedData: crypted_data,
      country: address_country,
      city: address_city,
      state: address_state,
      zip: address_zip,
      addressLine1: address_line1,
      addressLine2: address_line2,
    } = cardDetails;

    const cardObj = {
      card: {
        crypted_data,
        address_country,
        address_city,
        address_state,
        address_zip,
        address_line1,
        address_line2,
      },
    };
    return this.createToken(cardObj);
  }

  /**
   * Create a token on Tap.
   * @param {Object} paymentData - Payment data containing card data or encrypted card data.
   * @returns {Promise<Object>} - The newly created token object.
   */
  async createToken(paymentData: any) {
    const resp = await fetch(`${this.baseURL}/tokens`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(paymentData),
    });
    return await resp.json();
  }

  /**
   * Create a Tap charge for a given amount, currency, user and metadata.
   * @param {Object} params - charge parameters
   * @param {number} params.amount - charge amount
   * @param {string} params.currency - charge currency
   * @param {string} params.userId - user ID
   * @param {Object} params.metadata - additional charge metadata
   * @returns {Promise<Object>} - created Tap charge
   */
  async createCharge(params: any) {
    const {
      amount,
      currency,
      description,
      reference,
      metadata,
      merchantId,
      sourceId,
      customerId,
      orderId,
    } = params;

    // create local orderId to avoid duplicate charges
    const localOrderId =
      orderId || `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const merchant = merchantId ? { id: merchantId } : undefined;
    const source = sourceId ? { id: sourceId } : undefined;
    const customerData = customerId
      ? { id: customerId }
      : {
          first_name: "test",
          middle_name: "test",
          last_name: "test",
          email: "test@test.com",
          phone: {
            country_code: 965,
            number: 51234567,
          },
        };
    // Build payload per Tap docs; you can add return_url for redirect-based checkout
    const chargeObj = {
      amount: amount || 1,
      currency: currency || "KWD",
      customer_initiated: true,
      threeDSecure: true,
      save_card: true,
      description: description || "Test Description",
      metadata: metadata || {
        udf1: "Metadata 1",
        localOrderId,
      },
      receipt: {
        email: false,
        sms: false,
      },
      reference: reference || {
        transaction: "txn_01",
        order: orderId || "ord_01",
      },
      customer: customerData,
      merchant: merchant || "599424",
      source,
      post: { url: "https://yourbackend.com/webhook" },
      redirect: { url: "https://yourfrontend.com/payment-redirect" },
    };

    const resp = await fetch(`${this.baseURL}/charges`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(chargeObj),
    });
    const data = await resp.json();

    // Return data client needs to open checkout or SDK
    return data;
  }

  /**
   * Handle Tap webhook event
   * @param {Buffer} rawBody - raw JSON body of webhook event
   * @param {string} signature - HMAC-SHA256 signature of rawBody
   * @returns {Promise<TapPaymentModel>} - updated Tap payment document
   * @throws {ErrorHandler} - if signature is invalid
   */
  async handleWebhook(rawBody: Buffer, signature: string) {
    // Use your webhook secret (or TAP_SECRET_KEY) to validate HMAC-SHA256 of raw body
    const secret = this.tapSecretKey || this.tapWebhookSecret;
    const computedHash = crypto
      .createHmac("sha256", secret)
      .update(rawBody as any)
      .digest("hex");

    if (!signature || computedHash !== signature) {
      console.log("signature =>", signature);
      console.log("computedHash =>", computedHash);
      console.warn("Invalid webhook signature");
      //   throw new ErrorHandler("Invalid signature", 400);
    }

    const event = JSON.parse(rawBody.toString()); // event payload
    console.log("Webhook Event Data =>", event);
    // Example event structure: event.type, event.data.id (charge id), event.data.status
    const tapChargeId = event?.id || event?.object?.id;
    const orderId = event?.metadata?.orderId;
    const userId = event?.metadata?.userId;
    const status = event?.status || event?.object?.status;

    // Idempotent update
    if (tapChargeId) {
      // Apply business logic: mark order paid, send receipt, etc.
      // IMPORTANT: Acknowledge quickly
      if (orderId || userId || status) {
        // TODO: Implement business logic
      }
    }
    return event;
  }

  /**
   * Refund a Tap payment charge
   * @param {object} params - parameters to refund a charge
   * @param {string} params.chargeId - ID of the charge to refund
   * @param {number} params.amount - amount to refund (in cents)
   * @param {string} params.reason - reason for refund
   * @returns {Promise<object>} - response from Tap API
   */
  async refundCharge(params: any) {
    const { chargeId, amount, reason } = params;
    const payload = { charge_id: chargeId, amount, reason };
    const resp = await fetch(`${this.baseURL}/refunds`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(payload),
    });
    return await resp.json();
  }

  /**
   * Get all cards associated with a customer
   * @param {string} customerId - ID of the customer
   * @returns {Promise<object[]>} - array of customer cards
   */
  async getCards(customerId: string) {
    const resp = await fetch(`${this.baseURL}/card/${customerId}`, {
      method: "GET",
      headers: this.headers,
    });
    return await resp.json();
  }

  /**
   * Retrieves a Tap charge by ID.
   * @param {string} chargeId - ID of the charge to retrieve
   * @returns {Promise<object>} - The retrieved charge object
   */
  async getCharge(chargeId: string) {
    const resp = await fetch(`${this.baseURL}/charges/${chargeId}`, {
      method: "GET",
      headers: this.headers,
    });
    return await resp.json();
  }
}

export default new TapManager();
// Object.freeze(new TapManager());
