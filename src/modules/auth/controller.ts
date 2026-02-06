// file imports
import NodeMailer from "../../utils/node-mailer";
import * as adminController from "../admin/controller";
import * as userController from "../user/controller";
import * as userTokenController from "../user-token/controller";
import * as profileController from "../profile/controller";
import { User } from "../user/interface";
import { Admin } from "../admin/interface";
import { USER_TYPES, ACCOUNT_STATUSES } from "../../configs/enum";
import { ErrorHandler } from "../../middlewares/error-handler";
import {
  LoginDTO,
  SendEmailDTO,
  GenerateEmailTokenDTO,
  ResetPasswordDTO,
  VerifyUserEmailDTO,
} from "./dto";

// destructuring assignments
const { STANDARD } = USER_TYPES;
const { ACTIVE } = ACCOUNT_STATUSES;
const {
  sendEmail,
  getEmailVerificationEmailTemplate,
  getResetPasswordEmailTemplate,
  getWelcomeUserEmailTemplate,
} = NodeMailer;

/**
 * @description Register user
 * @param {Object} params user registration data
 * @returns {string} user token
 */
export const registerUser = async (params: User) => {
  const { type } = params;
  const user = await userController.addUser(params);

  const profileObj = { user: user._id };
  const userObj: Partial<User> = {};
  userObj.type = type;

  if (type !== STANDARD)
    userObj.profile = (await profileController.addProfile(profileObj))._id;

  if (userObj?.profile) await userController.updateUserById(user._id, userObj);

  return user;
};

/**
 * @description Register admin
 * @param {Object} params admin registration data
 * @returns {string} admin token
 */
export const registerAdmin = async (params: Admin) => {
  const admin = await adminController.addAdmin(params);
  return admin.getSignedjwtToken();
};

/**
 * @description Login user
 * @param {Object} params user login data
 * @returns {Object} user token
 */
export const loginUser = async (params: LoginDTO) => {
  const { email, password } = params;

  const query: any = {};

  if (email && password) query.email = email;
  else throw new ErrorHandler("Please enter login credentials!", 400);

  const userExists: any = await userController.getUser(query);
  if (!userExists) throw new ErrorHandler("Account not registered!", 404);

  if (!(await userExists.validatePassword(password)))
    throw new ErrorHandler("Invalid password!", 401);

  if (userExists.status !== ACTIVE)
    throw new ErrorHandler(`Account ${userExists.status}!`, 403);

  await userController.updateUserById(userExists._id, {
    lastLogin: new Date(),
  });

  return userExists.getSignedjwtToken();
};

/**
 * @description Login admin
 * @param {Object} params admin login data
 * @returns {Object} admin token
 */
export const loginAdmin = async (params: LoginDTO) => {
  const { email, password } = params;

  const query: any = {};

  if (email && password) query.email = email;
  else throw new ErrorHandler("Please enter login credentials!", 400);

  const adminExists: any = await adminController.getAdmin(query);
  if (!adminExists) throw new ErrorHandler("Account not registered!", 404);

  if (!(await adminExists.validatePassword(password)))
    throw new ErrorHandler("Invalid password!", 401);

  if (adminExists.status !== ACTIVE)
    throw new ErrorHandler(`Account ${adminExists.status}!`, 403);

  await adminController.updateAdminById(adminExists._id, {
    lastLogin: new Date(),
  });

  return adminExists.getSignedjwtToken();
};

/**
 * @description Send reset password email
 * @param {Object} params user email data
 * @returns {Object} user password reset data
 */
export const emailResetPassword = async (params: SendEmailDTO) => {
  const { email } = params;
  const tokenExpirationTime = new Date();
  tokenExpirationTime.setMinutes(tokenExpirationTime.getMinutes() + 10);
  const { user, token } = await generateEmailToken({
    email,
    tokenExpirationTime,
  });
  const args: any = {};
  args.to = email;
  args.subject = "Password reset";
  args.text = getResetPasswordEmailTemplate({ user, token });
  return await sendEmail(args);
};

/**
 * @description Send email verification email
 * @param {Object} params user email data
 * @returns {Object} user email verification data
 */
export const emailVerifyEmail = async (params: SendEmailDTO) => {
  const { email } = params;
  const tokenExpirationTime = new Date();
  tokenExpirationTime.setMinutes(tokenExpirationTime.getMinutes() + 10);
  const { user, token } = await generateEmailToken({
    email,
    tokenExpirationTime,
  });
  const args: any = {};
  args.to = email;
  args.subject = "Email verification";
  args.text = getEmailVerificationEmailTemplate({ user, token });
  return await NodeMailer.sendEmail(args);
};

/**
 * @description Send welcome email
 * @param {Object} params user email data
 * @returns {Object} user welcome data
 */
export const emailWelcomeUser = async (params: SendEmailDTO) => {
  const { email, name } = params;
  const args: any = {};
  args.to = email;
  args.subject = "Greetings";
  args.text = getWelcomeUserEmailTemplate({ name });
  return await NodeMailer.sendEmail(args);
};

/**
 * @description Generate user email token
 * @param {Object} params user token generation data
 * @returns {Object} user token data
 */
export const generateEmailToken = async (params: GenerateEmailTokenDTO) => {
  const { email, tokenExpirationTime } = params;
  const userExists: any = await userController.getUser({ email });
  if (!userExists)
    throw new ErrorHandler("User with given email doesn't exist!", 404);
  let userTokenExists = await userTokenController.getElement({
    user: userExists._id,
  });
  if (!userTokenExists) {
    const userTokenObj: any = {};
    userTokenObj.user = userExists._id;
    userTokenObj.token = userExists.getSignedjwtToken();
    userTokenObj.expireAt = tokenExpirationTime;

    userTokenExists = await userTokenController.addElement(userTokenObj);
  }
  return userTokenExists;
};

/**
 * @description Reset user password
 * @param {Object} params user password reset data
 */
export const resetPassword = async (
  params: ResetPasswordDTO,
): Promise<void> => {
  const { password, user, token } = params;

  const userExists: any = await userController.getUserById(user);
  if (!userExists) throw new ErrorHandler("Invalid link!", 400);

  const userTokenExists = await userTokenController.getElement({
    user,
    token,
  });
  if (!userTokenExists) throw new ErrorHandler("Invalid or expired link!", 400);

  await userExists.setPassword(password);
  await userTokenExists.deleteOne();
};

/**
 * @description Email user email
 * @param {Object} params user email verification data
 */
export const verifyUserEmail = async (
  params: VerifyUserEmailDTO,
): Promise<void> => {
  const { user, token } = params;

  const userExists = await userController.getUserById(user);
  if (!userExists) throw new ErrorHandler("Invalid link!", 400);

  const userTokenExists = await userTokenController.getElement({
    user,
    token,
  });
  if (!userTokenExists) throw new ErrorHandler("Invalid or expired link!", 400);

  userExists.isEmailVerified = true;
  await userExists.save();
  await userTokenExists.deleteOne();
};
