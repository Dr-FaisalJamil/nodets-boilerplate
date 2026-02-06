// file imports
import { ENVIRONMENT_VARIABLES } from "../configs/enum";
import { requireEnv } from "../configs/helper";

class FacebookAuthenticator {
  private static instance: FacebookAuthenticator;

  private readonly clientId = requireEnv(
    ENVIRONMENT_VARIABLES.FACEBOOK_CLIENT_ID,
  );
  private readonly clientSecret = requireEnv(
    ENVIRONMENT_VARIABLES.FACEBOOK_CLIENT_SECRET,
  );
  private readonly redirectUri = requireEnv(
    ENVIRONMENT_VARIABLES.FACEBOOK_REDIRECT_URI,
  );

  constructor() {
    if (!FacebookAuthenticator.instance) {
      FacebookAuthenticator.instance = this;
    }
    return FacebookAuthenticator.instance;
  }

  /**
   * Get Facebook OAuth2 URL for authentication
   * @param state Optional state parameter for CSRF protection
   * @returns Facebook OAuth2 URL
   */
  getAuthUrl(state?: string): string {
    const baseUrl = "https://www.facebook.com/v18.0/dialog/oauth";
    const params: Record<string, string> = {
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: "code",
      scope: "email,public_profile",
    };
    if (state) params.state = state;
    const searchParams = new URLSearchParams(params);
    return `${baseUrl}?${searchParams.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   * @param code Authorization code
   * @returns Tokens
   */
  async getTokens(code: string): Promise<any> {
    const tokenUrl = "https://graph.facebook.com/v18.0/oauth/access_token";
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      code,
    });
    const response = await fetch(`${tokenUrl}?${params.toString()}`, {
      method: "GET",
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get tokens: ${response.status} ${error}`);
    }
    return response.json();
  }

  /**
   * Verify and decode a Facebook access token sent from the frontend.
   * @param accessToken The access token from the frontend
   * @returns The token info if valid, otherwise throws an error
   */
  async verifyAccessToken(accessToken: string): Promise<any> {
    // App access token: {app-id}|{app-secret}
    const appAccessToken = `${this.clientId}|${this.clientSecret}`;
    const debugUrl = `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(
      accessToken,
    )}&access_token=${encodeURIComponent(appAccessToken)}`;

    const response = await fetch(debugUrl, { method: "GET" });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Failed to verify Facebook access token: ${response.status} ${error}`,
      );
    }
    const data: any = await response.json();
    if (!data.data || !data.data.is_valid) {
      throw new Error("Invalid Facebook access token");
    }
    // Optionally, check data.data.app_id === this.clientId
    return data.data;
  }

  /**
   * Get user profile information using access token
   * @param accessToken Access token
   * @returns User profile
   */
  async getUserProfile(accessToken: string): Promise<any> {
    // await this.verifyAccessToken(accessToken);
    const profileUrl =
      "https://graph.facebook.com/me?fields=id,name,email,picture";
    const response = await fetch(
      `${profileUrl}&access_token=${encodeURIComponent(accessToken)}`,
      { method: "GET" },
    );
    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Failed to get user profile: ${response.status} ${error}`,
      );
    }
    return response.json();
  }

  /**
   * Authenticate a user with a Facebook access token and a user ID.
   * @param token The Facebook access token from the frontend
   * @param facebookId The user ID from the frontend
   * @returns The decoded user info if valid, otherwise throws an error
   */
  async authenticate(token: string, facebookId: string): Promise<any> {
    await this.verifyAccessToken(token);
    const user = await this.getUserProfile(token);
    if (user.id == facebookId) return user;
    else throw new Error("Invalid or Expired Facebook ID Token!");
  }
}

export default new FacebookAuthenticator();
// Object.freeze(new FacebookAuthenticator());
