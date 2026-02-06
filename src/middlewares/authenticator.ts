// module imports
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

// file imports
import * as userController from "../modules/user/controller";
import * as adminController from "../modules/admin/controller";
import { IRequest } from "../configs/types";
import { exceptionHandler } from "./exception-handler";
import { ErrorHandler } from "./error-handler";
import { ACCOUNT_STATUSES, ADMIN_TYPES, USER_TYPES } from "../configs/enum";

// destructuring assignments
const { JWT_SECRET, API_KEY, DOCS_USERNAME, DOCS_PASSWORD } = process.env;

/**
 * @description Get JWT token
 * @param {string} _id user id
 * @param {string} phone user phone number
 * @param {string} otp OTP code
 * @param {string} shouldValidateOTP OTP validation check
 * @param {string | boolean } variable any variable
 * @returns {Object} JWT token
 */
export const getToken = function (params: object): string {
  return jwt.sign(params, JWT_SECRET || "");
};

/**
 * @description Verify user token
 */
export const verifyUserToken = async (
  req: any,
  _res: Response,
  next: NextFunction,
  shouldReturnUserOnFailure = false,
) => {
  try {
    const token =
      (req.headers.authorization &&
        req.headers.authorization.split("Bearer")[1]) ||
      (req.signedCookies && req.signedCookies.jwt) ||
      (req.cookies && req.cookies.jwt);
    if (token) {
      const verificationObject: any = jwt.verify(
        token.trim(),
        JWT_SECRET || "",
      );

      if (verificationObject.shouldValidateOTP) {
        req.user = verificationObject;
        return next();
      }
      const query = { user: verificationObject?._id, selection: "+isDeleted" };
      const user = await userController.getUser(query);
      if (user) {
        if (user.status !== ACCOUNT_STATUSES.ACTIVE)
          next(new ErrorHandler(`Account ${user.status}!`, 403));
        else if (user.isDeleted)
          next(new ErrorHandler(`Profile deleted!`, 403));
        req.user = await userController.updateUserById(user._id, {
          lastUsed: new Date(),
        });
        return next();
      }
    }
    if (shouldReturnUserOnFailure) {
      req.user = null;
      return next();
    }
    next(new ErrorHandler("Invalid Token!", 403));
  } catch (error) {
    if (shouldReturnUserOnFailure) {
      req.user = null;
      return next();
    }
    return next(new ErrorHandler("Unauthorized!", 401));
  }
};

/**
 * @description Verify admin token
 */
export const verifyAdminToken = async (
  req: any,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const token =
      (req.headers.authorization &&
        req.headers.authorization.split("Bearer")[1]) ||
      (req.signedCookies && req.signedCookies.jwt) ||
      (req.cookies && req.cookies.jwt);
    if (token) {
      const verificationObject: any = jwt.verify(
        token.trim(),
        JWT_SECRET || "",
      );
      const admin = await adminController.getAdminById(verificationObject?._id);
      if (admin) {
        if (admin.status !== ACCOUNT_STATUSES.ACTIVE)
          next(new ErrorHandler(`Account ${admin.status}!`, 403));
        req.admin = admin;
        admin.lastUsed = new Date();
        await admin.save();
        return next();
      }
    }
    next(new ErrorHandler("Invalid Token!", 403));
  } catch (error) {
    return next(new ErrorHandler("Unauthorized!", 401));
  }
};

/**
 * @description Verify OTP code
 */
export const verifyOTP = exceptionHandler(
  async (req: IRequest, _res: Response, next: NextFunction): Promise<void> => {
    const { otp } = req.user;
    const { code } = req.body;
    const query: any = { selection: "+otp" };
    if (req?.user?._id) query._id = req.user._id;
    else if (req.user?.phone) query.phone = req.user.phone;
    else query._id = null;
    const userExists: any = await userController.getUser(query);

    if (userExists && code === userExists?.otp) next();
    else if (code === otp) next();
    else return next(new ErrorHandler("Invalid Code!", 400));
  },
);

/**
 * @description Verify if the admin is a standard or super admin
 */
export const verifyStandardAdmin = (
  req: IRequest,
  _res: object,
  next: any,
): void => {
  if (
    req?.admin?.type === ADMIN_TYPES.STANDARD ||
    req?.admin?.type === ADMIN_TYPES.SUPER_ADMIN
  )
    next();
  else next(new ErrorHandler("Unauthorized as admin!", 403));
};

/**
 * @description Verify if the admin is a super admin
 */
export const verifySuperAdmin = (
  req: IRequest,
  _res: object,
  next: any,
): void => {
  if (req?.admin?.type === ADMIN_TYPES.SUPER_ADMIN) next();
  else next(new ErrorHandler("Unauthorized as super-admin!", 403));
};

/**
 * @description Verify if the user is a standard user
 */
export const verifyStandardUser = (
  req: IRequest,
  _res: object,
  next: any,
): void => {
  if (req?.user?.type === USER_TYPES.STANDARD) next();
  else next(new ErrorHandler("Unauthorized as standard user!", 403));
};

/**
 * @description Verify if the user has a valid token
 */
export const verifyValidUserToken = (
  req: IRequest,
  _res: object,
  next: any,
): void => {
  if (req?.user?._id) next();
  else next(new ErrorHandler("Invalid Token!", 400));
};

/**
 * @description Verify if the admin has a valid token
 */
export const verifyValidAdminToken = (
  req: IRequest,
  _res: object,
  next: any,
): void => {
  if (req?.admin?._id) next();
  else next(new ErrorHandler("Invalid Token!", 400));
};

/**
 * @description Middleware to check if the user exists
 */
export const checkUserPhoneExists = exceptionHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const userExists = await userController.checkUserExistence({
      phone: req.body.phone,
    });
    if (userExists) next();
    else next(new ErrorHandler("User not found!", 404));
  },
);

/**
 * @description Middleware to verify the API key from request headers.
 * @throws {ErrorHandler} Throws an error if the API key is invalid.
 */
export const verifyAPIKey = (req: IRequest, _res: object, next: any): void => {
  const api_key = req.headers["api-key"];
  if (api_key === API_KEY) next();
  else throw new ErrorHandler("Invalid API key!", 400);
};

/**
 * Basic authentication middleware for Swagger Docs.
 * Sets WWW-Authenticate header and returns 401 status code if authentication fails.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
export function basicAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Basic ")) {
    res.set("WWW-Authenticate", 'Basic realm="Swagger Docs"');
    res.status(401).send("Authentication required.");
    return;
  }
  const base64 = auth.split(" ")[1];
  const [user, pass] = Buffer.from(base64, "base64").toString().split(":");
  if (user === DOCS_USERNAME && pass === DOCS_PASSWORD) {
    return next();
  }
  res.set("WWW-Authenticate", 'Basic realm="Swagger Docs"');
  res.status(401).send("Authentication failed.");
}
