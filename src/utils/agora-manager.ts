// module imports
const {
  RtcTokenBuilder,
  RtcRole,
  RtmTokenBuilder,
  RtmRole,
} = require("agora-access-token");

// file imports
import { ENVIRONMENT_VARIABLES } from "../configs/enum";
import { requireEnv } from "../configs/helper";

class AgoraManager {
  private static instance: AgoraManager;

  private readonly appId = requireEnv(ENVIRONMENT_VARIABLES.AGORA_APP_ID);
  private readonly appCertificate = requireEnv(
    ENVIRONMENT_VARIABLES.AGORA_APP_CERTIFICATE,
  );

  constructor() {
    if (!AgoraManager.instance) {
      AgoraManager.instance = this;
    }
    return AgoraManager.instance;
  }

  /**
   * @description Generate RTC token
   * @param {String} channel channel name
   * @param {String} user user id
   * @param {String} userRole user role
   * @param {Number} expiry expiration time in seconds
   * @param {String} tokenType token type
   * @returns {String} RTC token
   */
  async generateRTCToken(params: any) {
    const { channel, user, userRole, expiry, tokenType } = params;

    // get channel name
    const channelName = channel;
    if (!channelName) throw new Error("Channel is required");
    // get uid
    let uid = user;
    if (!uid || uid === "") throw new Error("User id is required");
    // get role
    let role;
    if (userRole === "publisher") role = RtcRole.PUBLISHER;
    else if (userRole === "audience") role = RtcRole.SUBSCRIBER;
    else throw new Error("Role is incorrect");

    // get the expire time
    let expireTime = expiry;
    if (!expireTime || expireTime === "") {
      expireTime = 86400;
    } else {
      expireTime = parseInt(expireTime, 10);
    }
    // calculate privilege expire time
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expireTime;
    // build the token
    let token;
    if (tokenType === "userAccount") {
      token = RtcTokenBuilder.buildTokenWithAccount(
        this.appId,
        this.appCertificate,
        channelName,
        uid,
        role,
        privilegeExpireTime,
      );
    } else if (tokenType === "uid") {
      token = RtcTokenBuilder.buildTokenWithUid(
        this.appId,
        this.appCertificate,
        channelName,
        uid,
        role,
        privilegeExpireTime,
      );
    } else {
      throw new Error("Token type is invalid");
    }
    // return the token
    return token;
  }

  /**
   * @description Generate RTM token
   * @param {String} user user id
   * @param {Number} expiry expiration time in seconds
   * @returns {String} RTM token
   */
  async generateRTMToken(params: any) {
    const { user, expiry } = params;

    // get uid
    let uid = user;
    if (!uid || uid === "") throw new Error("User id is required");
    // get role
    let role = RtmRole.Rtm_User;
    // get the expire time
    let expireTime = expiry;
    if (!expireTime || expireTime === "") {
      expireTime = 86400;
    } else {
      expireTime = parseInt(expireTime, 10);
    }
    // calculate privilege expire time
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expireTime;
    // build the token
    console.log(
      this.appId,
      this.appCertificate,
      uid,
      role,
      privilegeExpireTime,
    );
    const token = RtmTokenBuilder.buildToken(
      this.appId,
      this.appCertificate,
      uid,
      role,
      privilegeExpireTime,
    );
    // return the token
    return token;
  }

  /**
   * @description Generate RTC token
   * @param {String} channel channel name
   * @param {String} user user id
   * @param {String} userRole user role
   * @param {Number} expiry expiration time in seconds
   * @returns {String} RTC token
   */
  async generateRTEToken(params: any) {
    const { channel, user, userRole, expiry } = params;

    // get channel name
    const channelName = channel;
    if (!channelName) throw new Error("Channel is required");
    // get uid
    let uid = user;
    if (!uid || uid === "") throw new Error("User id is required");
    // get role
    let role;
    if (userRole === "publisher") role = RtcRole.PUBLISHER;
    else if (userRole === "audience") role = RtcRole.SUBSCRIBER;
    else throw new Error("Role is incorrect");

    // get the expire time
    let expireTime = expiry;
    if (!expireTime || expireTime === "") {
      expireTime = 86400;
    } else {
      expireTime = parseInt(expireTime, 10);
    }
    // calculate privilege expire time
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expireTime;
    // build the token
    const rtcToken = RtcTokenBuilder.buildTokenWithUid(
      this.appId,
      this.appCertificate,
      channelName,
      uid,
      role,
      privilegeExpireTime,
    );
    const rtmToken = RtmTokenBuilder.buildToken(
      this.appId,
      this.appCertificate,
      uid,
      role,
      privilegeExpireTime,
    );
    // return the token
    return { rtcToken: rtcToken, rtmToken: rtmToken };
  }
}

export default new AgoraManager();
// Object.freeze(new AgoraManager());
