class CloverManager {
  private static instance: CloverManager | null = null;

  constructor() {
    if (!CloverManager.instance) {
      CloverManager.instance = this;
    }
    return CloverManager.instance;
  }

  /**
   * Load details from Clover by url.
   * @param url URL to load data
   * @returns loaded data
   */
  private async loadDetails(
    url: string,
    method: string,
    body?: any,
    headers?: any,
  ): Promise<any> {
    console.log(`Loading details from: ${url}`);
    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to load details: ${response.status} ${error}`);
    }
    return response.json();
  }

  /**
   * Get merchant details from Clover by merchant ID.
   * @param merchantId The ID of the merchant to retrieve
   * @returns Order details
   */
  async getMerchantDetails(
    merchantId: string,
    cloverToken: string,
  ): Promise<any> {
    const orderUrl = `https://sandbox.dev.clover.com/v3/merchants/${merchantId}`;
    console.log(`Fetching merchant details from: ${orderUrl}`);
    return await this.loadDetails(orderUrl, "GET", undefined, {
      Authorization: `Bearer ${cloverToken}`,
    });
  }

  /**
   * Get order details from Clover by merchant and order ID.
   * @param merchantId The ID of the merchant to retrieve
   * @param orderId The ID of the order to retrieve
   * @returns Order details
   */
  async getOrderDetails(
    merchantId: string,
    orderId: string,
    cloverToken: string,
  ): Promise<any> {
    const orderUrl = `https://sandbox.dev.clover.com/v3/merchants/${merchantId}/orders/${orderId}?expand=lineItems`;
    console.log(`Fetching order details from: ${orderUrl}`);
    return await this.loadDetails(orderUrl, "GET", undefined, {
      Authorization: `Bearer ${cloverToken}`,
    });
  }

  /**
   * Fetches all available payment tenders for a merchant from Clover's API.
   * @param {string} merchantId The ID of the merchant to fetch tenders for.
   * @param {string} cloverToken The Clover token to use for authentication.
   * @returns {Promise<any>} A promise that resolves to the tenders data.
   */
  async getMerchantTenders(
    merchantId: string,
    cloverToken: string,
  ): Promise<any> {
    const tendersUrl = `https://sandbox.dev.clover.com/v3/merchants/${merchantId}/tenders`;
    console.log(`Fetching merchant tenders from: ${tendersUrl}`);
    return await this.loadDetails(tendersUrl, "GET", undefined, {
      Authorization: `Bearer ${cloverToken}`,
    });
  }

  /**
   * Create a hosted checkout session on Clover's API.
   *
   * @param {string} merchantId The ID of the merchant to create the checkout for.
   * @param {number} amount The amount of the checkout in USD.
   * @return {Promise<any>} The response from Clover's API.
   */
  async createHostedCheckout(
    merchantId: string,
    amount: number,
    cloverToken: string,
    customerData?: any,
  ) {
    const checkoutUrl = `https://apisandbox.dev.clover.com/invoicingcheckoutservice/v1/checkouts`;
    const headers = {
      "X-Clover-Merchant-Id": merchantId,
      "Content-Type": "application/json",
      Authorization: `Bearer ${cloverToken}`,
    };
    const body = {
      customer: customerData || {}, // optional: can include name/email if desired
      shoppingCart: {
        lineItems: [
          {
            // itemRefUuid: "4RYGP97VE7D5R",
            name: "Test Item",
            price: (amount || 0) * 100, // in cents, e.g. 5000 = $50
            unitQty: 1,
          },
        ],
      },
      redirectUrl: "https://example.com/payment-success", // must be HTTPS in prod
    };
    console.log(
      `Creating hosted checkout for: ${merchantId}, amount: ${amount}`,
    );
    return await this.loadDetails(checkoutUrl, "POST", body, headers);
  }
}

export default new CloverManager();
// Object.freeze(new CloverManager());
