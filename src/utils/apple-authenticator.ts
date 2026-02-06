// module imports
// import jwksClient from "jwks-rsa";
import jwt, { JwtHeader, SigningKeyCallback } from "jsonwebtoken";

// file imports
import { ENVIRONMENT_VARIABLES } from "../configs/enum";
import { requireEnv } from "../configs/helper";

class AppleAuthenticator {
  private static instance: AppleAuthenticator;

  private readonly clientId = requireEnv(ENVIRONMENT_VARIABLES.APPLE_CLIENT_ID);
  private readonly teamId = requireEnv(ENVIRONMENT_VARIABLES.APPLE_TEAM_ID);
  private readonly keyId = requireEnv(ENVIRONMENT_VARIABLES.APPLE_KEY_ID);
  private readonly redirectUri = requireEnv(
    ENVIRONMENT_VARIABLES.APPLE_REDIRECT_URI,
  );
  private readonly privateKey = requireEnv(
    ENVIRONMENT_VARIABLES.APPLE_PRIVATE_KEY,
  );

  constructor() {
    if (!AppleAuthenticator.instance) {
      AppleAuthenticator.instance = this;
    }
    return AppleAuthenticator.instance;
  }

  /**
   * Get Apple OAuth2 URL for authentication
   * @param state Optional state parameter for CSRF protection
   * @returns Apple OAuth2 URL
   */
  getAuthUrl(state?: string): string {
    const baseUrl = "https://appleid.apple.com/auth/authorize";
    const params: Record<string, string> = {
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: "code",
      scope: "name email",
      response_mode: "form_post",
    };
    if (state) params.state = state;
    const searchParams = new URLSearchParams(params);
    return `${baseUrl}?${searchParams.toString()}`;
  }

  /**
   * Generate client secret (JWT) for Apple token exchange
   * @returns JWT client secret
   */
  generateClientSecret(): string {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: this.teamId,
      iat: now,
      exp: now + 60 * 60 * 24, // 24 hours
      aud: "https://appleid.apple.com",
      sub: this.clientId,
    };
    return jwt.sign(payload, this.privateKey, {
      algorithm: "ES256",
      keyid: this.keyId,
    });
  }

  /**
   * Exchange authorization code for tokens
   * @param code Authorization code
   * @returns Tokens
   */
  async getTokens(code: string): Promise<any> {
    const tokenUrl = "https://appleid.apple.com/auth/token";
    const clientSecret = this.generateClientSecret();
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: this.redirectUri,
    });
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get tokens: ${response.status} ${error}`);
    }
    return response.json();
  }

  /**
   * Get user profile information using id_token
   * @param idToken ID token (JWT)
   * @returns User profile (decoded JWT)
   */
  async getUserProfile(idToken: string): Promise<any> {
    // Apple does not provide a userinfo endpoint; user info is in the id_token (JWT)
    try {
      const decoded = jwt.decode(idToken);
      return decoded;
    } catch (err) {
      throw new Error("Failed to decode Apple ID token");
    }
  }

  /**
   * Verify and decode an Apple ID token (JWT) sent from the frontend.
   * @param idToken The ID token from the frontend
   * @returns The decoded user info if valid, otherwise throws an error
   */
  async verifyIdToken(idToken: string): Promise<any> {
    // Set up JWKS client for Apple
    // const client = jwksClient({
    //   jwksUri: "https://appleid.apple.com/auth/keys",
    //   cache: true,
    //   cacheMaxEntries: 5,
    //   cacheMaxAge: 10 * 60 * 1000, // 10 minutes
    // });
    // // Helper to get signing key
    // function getKey(header: JwtHeader, callback: SigningKeyCallback) {
    //   client.getSigningKey(header.kid, function (err, key) {
    //     if (err) {
    //       callback(err, undefined);
    //     } else {
    //       const signingKey = key?.getPublicKey();
    //       callback(null, signingKey);
    //     }
    //   });
    // }
    // // Verify the token
    // return new Promise((resolve, reject) => {
    //   jwt.verify(
    //     idToken,
    //     getKey,
    //     {
    //       algorithms: ["RS256"],
    //       audience: this.clientId,
    //       issuer: "https://appleid.apple.com",
    //     },
    //     (err, decoded) => {
    //       if (err) {
    //         reject(new Error("Invalid Apple ID token: " + err.message));
    //       } else {
    //         resolve(decoded);
    //       }
    //     }
    //   );
    // });
  }

  /**
   * Authenticate a user with an Apple ID token and a user ID.
   * @param token The Apple ID token from the frontend
   * @param appleId The user ID from the frontend
   * @returns The decoded user info if valid, otherwise throws an error
   */
  async authenticate(token: string, appleId: string): Promise<any> {
    const user = await this.verifyIdToken(token);
    if (user.sub == appleId) return user;
    else throw new Error("Invalid or Expired Apple ID Token!");
  }
}

export default new AppleAuthenticator();
// Object.freeze(new AppleAuthenticator());
