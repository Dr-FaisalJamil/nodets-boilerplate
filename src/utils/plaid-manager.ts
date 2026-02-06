// module imports
// import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

// file imports
import { ENVIRONMENTS, ENVIRONMENT_VARIABLES } from "../configs/enum";
import { requireEnv } from "../configs/helper";

class PlaidManager {
  private static instance: PlaidManager;

  private readonly nodeEnv = requireEnv(ENVIRONMENT_VARIABLES.NODE_ENV);
  private readonly plaidSecret = requireEnv(ENVIRONMENT_VARIABLES.PLAID_SECRET);
  private readonly plaidClientId = requireEnv(
    ENVIRONMENT_VARIABLES.PLAID_CLIENT_ID,
  );
  // private readonly configuration = new Configuration({
  //   basePath:
  //     this.nodeEnv === ENVIRONMENTS.PRODUCTION
  //       ? PlaidEnvironments.production
  //       : PlaidEnvironments.development,
  //   baseOptions: {
  //     headers: {
  //       "PLAID-CLIENT-ID": this.plaidClientId,
  //       "PLAID-SECRET": this.plaidSecret,
  //     },
  //   },
  // });
  // private readonly client = new PlaidApi(this.configuration);

  constructor() {
    if (!PlaidManager.instance) {
      PlaidManager.instance = this;
    }
    return PlaidManager.instance;
  }

  /**
   * Generate a link token
   * @param {string} clientUserId client user id
   * @param {string} clientName client name
   * @param {[string]} products products
   * @param {string} language language
   * @param {string} webhook webhook URL
   * @param {string} redirectURI redirect URI
   * @param {[string]} countryCodes country codes
   * @returns {object} link token
   */
  async generateLinkToken(params: any) {
    const {
      clientUserId,
      clientName,
      products,
      language,
      webhook,
      redirectURI,
      countryCodes,
    } = params;
    const request = {
      user: {
        // This should correspond to a unique id for the current user.
        client_user_id: clientUserId,
      },
      client_name: clientName ?? "Plaid Test App",
      products: products ?? ["transactions"],
      language: language ?? "en",
      webhook: webhook ?? "https://app.com/plaid/webhook",
      redirect_uri: redirectURI ?? "https://app.page.link/plaid",
      country_codes: countryCodes ?? ["US"],
    };
    // return await this.client.linkTokenCreate(request);
  }

  /**
   * Exchange public token
   * @param {string} publicToken public token
   * @returns {object} link token
   */
  async exchangePublicToken(publicToken: string) {
    // return await this.client.itemPublicTokenExchange({ public_token: publicToken });
  }

  /**
   * Create processor token
   * @param {string} token public token
   * @returns {object} link token
   */
  async createProcessorToken(params: any) {
    const { accessToken, accountID, processor } = params;
    const request = {
      access_token: accessToken,
      account_id: accountID,
      processor: processor ?? "alpaca",
    };
    // return await this.client.processorTokenCreate(request);
  }
}

export default new PlaidManager();
// Object.freeze(new PlaidManager());
