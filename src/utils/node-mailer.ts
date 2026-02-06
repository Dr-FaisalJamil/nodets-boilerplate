// module imports
// import nodemailer from "nodemailer";
// import { google } from "googleapis";

// file imports
import { requireEnv } from "../configs/helper";
import { ENVIRONMENT_VARIABLES } from "../configs/enum";

class NodeMailer {
  private static instance: NodeMailer;

  private readonly baseUrl = requireEnv(ENVIRONMENT_VARIABLES.BASE_URL);
  private readonly appTitle = requireEnv(ENVIRONMENT_VARIABLES.APP_TITLE);
  private readonly webAppUrl = requireEnv(ENVIRONMENT_VARIABLES.WEB_APP_URL);
  private readonly googleEmail = requireEnv(ENVIRONMENT_VARIABLES.GOOGLE_EMAIL);
  private readonly googleAppPassword = requireEnv(
    ENVIRONMENT_VARIABLES.GOOGLE_APP_PASSWORD,
  );
  private readonly supportEmail = requireEnv(
    ENVIRONMENT_VARIABLES.SUPPORT_EMAIL,
  );
  // private readonly transporter = nodemailer.createTransport({
  //   host: "smtp.gmail.com",
  //   port: 587,
  //   secure: false, // true for 465, false for other ports
  //   auth: {
  //     user: this.googleEmail,
  //     pass: this.googleAppPassword,
  //   },
  // });

  constructor() {
    if (!NodeMailer.instance) {
      NodeMailer.instance = this;
    }
    return NodeMailer.instance;
  }

  /**
   * @description Send email
   * @param {string} to receiver email address
   * @param {string} subject email subject
   * @param {string} text email text
   * @param {Object} html email html
   * @returns {Object} email response
   */
  async sendEmail(params: any) {
    const { to, subject, text, html } = params;
    // return await this.transporter.sendMail({
    //   from: `${this.appTitle} <${this.googleEmail}>`,
    //   to,
    //   subject,
    //   text,
    //   html,
    // });
  }

  /**
   * @description Get reset password email template
   * @param {string} user user id
   * @param {string} token user token
   * @returns {Object} email template
   */
  getResetPasswordEmailTemplate(params: any): string {
    const { user, token } = params;
    const link = `${this.baseUrl}/reset-password/?user=${user}&token=${token}`;
    return `
Please click on the link below to reset your password, 
${link}
Please note that this link will expire after 10 minutes.

If you didn't do this, contact us here ${this.supportEmail}`;
  }

  /**
   * @description Get email verification email template
   * @param {string} user user id
   * @param {string} token user token
   * @returns {Object} email template
   */
  getEmailVerificationEmailTemplate(params: any): string {
    const { user, token } = params;
    const link = `${this.baseUrl}/api/users/emails?user=${user}&token=${token}`;
    return `
Please click on the link below to verify your email address, 
${link}
Please note that this link will expire after 10 minutes.

If you didn't do this, contact us here ${this.supportEmail}`;
  }

  /**
   * @description Get user welcome email template
   * @param {string} name user name
   * @returns {Object} email template
   */
  getWelcomeUserEmailTemplate(params: any): string {
    const { name, password, email } = params;
    return `Dear ${name},

    We are delighted to inform you that an account has been created for you on ${this.appTitle}. You can now access the app using the following credentials:
    
    Username: ${email}
    Password: ${password}
    
    Please follow these steps to get started:
    
    Navigate to the ${this.webAppUrl}.
    Use your email address as the username.
    Enter the temporary password provided above.
    Upon your first login, you will be prompted to create a new, secure password for your account.
    
    If you have any questions or encounter any issues during the login process, please do not hesitate to contact our support team at ${this.supportEmail}.
    
    We look forward to having you as a valued member of our portal community!
    
    Best regards,

    Team ${this.appTitle}`;
  }

  /**
   * @description Get reset password email template
   * @param {string} name user name
   * @param {string} otp otp code
   * @returns {Object} email template
   */
  getOTPSendingEmailTemplate(params: any): string {
    const { name, otp } = params;
    return `Dear ${name},
Your One Time Password (OTP) is ${otp}. Please do not share this password with anyone.
Please note that this password will expire after 10 minutes.
  
If you didn't do this, contact us here ${this.supportEmail}`;
  }
}

export default new NodeMailer();
// Object.freeze(new NodeMailer());

// Google oAuth Setup

// module imports
// import { google } from "googleapis";

// destructuring assignments
// const {
//  GOOGLE_CLIENT_ID,
//   CLIENT_SECRET,
//   GOOGLE_REFRESH_TOKEN,
// } = process.env;

// variable initializations
// const OAuth2 = google.auth.OAuth2;
// const oauth2Client = new OAuth2(
//  GOOGLE_CLIENT_ID, // ClientID
//   CLIENT_SECRET, // Client Secret
//   "https://developers.google.com/oauthplayground" // Redirect URL
// ).setCredentials({
//   refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
// });
// const accessToken = oauth2Client.getAccessToken();
// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 465,
//   secure: true,
//   auth: {
//     type: "OAuth2",
//     user: GOOGLE_EMAIL,
//     clientId:GOOGLE_CLIENT_ID,
//     clientSecret: CLIENT_SECRET,
//     refreshToken: GOOGLE_REFRESH_TOKEN,
//     accessToken,
//   },
//   tls: {
//     rejectUnauthorized: false,
//   },
// });
