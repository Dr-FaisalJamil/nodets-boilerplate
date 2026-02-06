// module imports
// import admin from "firebase-admin";

// file imports
import ServiceAccount from "../services/backend-boilerplate-official-firebase-adminsdk-o1ajl-593da86247.json";

class FirebaseManager {
  private static instance: FirebaseManager;

  // private readonly connection = admin.initializeApp({
  //   credential: admin.credential.cert(ServiceAccount as admin.ServiceAccount),
  // });

  constructor() {
    if (!FirebaseManager.instance) {
      FirebaseManager.instance = this;
    }
    return FirebaseManager.instance;
  }

  /**
   * Send multicast firebase notification
   * @param {[string]} tokens firebase cloud messaging user tokens
   * @param {string} title notification title
   * @param {string} body notification body
   * @param {object} data notification data
   * @param {string} imageUrl notification image url
   * @returns {null}
   */
  async multicast(parameters: {
    title: string;
    body: string;
    tokens: string[];
    data?: any;
    imageUrl?: string;
  }): Promise<void> {
    const { title, body, imageUrl } = parameters;
    let { tokens, data } = parameters;
    tokens = tokens?.length > 0 ? tokens : ["null"];
    const stringifiedData = JSON.stringify(data || {}, null, 2);
    const jsonData = { title, body };
    data = data ? { stringifiedData, title, body } : jsonData;
    const message /* : admin.messaging.MulticastMessage */ = {
      tokens,
      notification: { title, body },
      data,
      android: {
        priority: "high",
        notification: {
          imageUrl: imageUrl ?? "https://nodejs.org/static/images/logo.svg",
        },
      },
      apns: {
        headers: {
          "apns-priority": "10",
        },
        payload: {
          aps: {
            mutableContent: true,
            sound: "default",
          },
        },
        fcmOptions: {
          imageUrl: imageUrl ?? "https://nodejs.org/static/images/logo.svg",
        },
      },
      webpush: {
        notification: { tag: data?.type || "general" },
        headers: {
          Urgency: "high",
          image: imageUrl ?? "https://nodejs.org/static/images/logo.svg",
        },
      },
    };
    // return this.connection
    //   .messaging()
    //   .sendEachForMulticast(message)
    //   .then((response: any) => {
    //     console.log("response", response);
    //     console.log("response.responses", response.responses);
    //   })
    //   .catch((error: any) => console.error(error));
  }
}

export default new FirebaseManager();
// Object.freeze(new FirebaseManager());
