// module imports
// import sgMail from "@sendgrid/mail";

// file imports
import { ENVIRONMENT_VARIABLES } from "../configs/enum";
import { requireEnv } from "../configs/helper";

class SendGridManager {
  private static instance: SendGridManager;

  private readonly supportEmail = requireEnv(
    ENVIRONMENT_VARIABLES.SUPPORT_EMAIL,
  );
  private readonly sendGridApiKey = requireEnv(
    ENVIRONMENT_VARIABLES.SEND_GRID_API_KEY,
  );

  constructor() {
    if (!SendGridManager.instance) {
      SendGridManager.instance = this;
      // sgMail.setApiKey(this.sendGridApiKey);
    }
    return SendGridManager.instance;
  }

  /**
   * Send email using SendGrid.
   * @param {string[]} recipients - The email addresses to send the email to.
   * @param {Record<string, any>} data - The dynamic data for the email template.
   * @returns {Promise<void>} - A promise that resolves when the email is sent.
   */
  send = async (
    recipients: string[],
    templateId: string,
    emailData: Record<string, any>,
  ): Promise<void> => {
    try {
      if (!recipients) throw new Error("Email not sent: no recipient provided");
      if (!Array.isArray(recipients))
        throw new Error("Email not sent: recipient is not an array");
      const message = {
        to: recipients,
        from: this.supportEmail,
        templateId,
        dynamicTemplateData: emailData, // Add other dynamic data for the template here
      };
      // await sgMail.send(message).then((response: any) => {
      //   console.log("SendGrid: Email sent successfully!");
      //   return response;
      // });
    } catch (error: any) {
      console.error("SendGrid: Email sending failed!", error.response.body);
    }
  };

  /**
   * Sends a welcome email using SendGrid.
   * @param {string[]} recipients - The email addresses to send the email to.
   * @param {Record<string, any>} data - The dynamic data for the email template.
   * @returns {Promise<void>} - A promise that resolves when the email is sent.
   */
  sendWelcomeEmail = async (
    recipients: string[],
    emailData: Record<string, any>,
  ): Promise<void> => {
    const templateId = "d-35727e251e1346ea9f60e031805d83c4";
    return await this.send(recipients, templateId, emailData);
  };
}

export default new SendGridManager();
// Object.freeze(new SendGridManager());
