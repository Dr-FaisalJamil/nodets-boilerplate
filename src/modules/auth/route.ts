// module imports
import { Response, Router } from "express";

// file imports
import * as authController from "./controller";
import * as userController from "../user/controller";
import * as adminController from "../admin/controller";
import { Admin } from "../admin/interface";
import { User } from "../user/interface";
import { LoginDTO, ResetPasswordDTO, SendEmailDTO } from "./dto";
import { exceptionHandler } from "../../middlewares/exception-handler";
import { IRequest } from "../../configs/types";
import { USER_TYPES } from "../../configs/enum";
import {
  verifyOTP,
  verifyAPIKey,
  verifyUserToken,
  verifyAdminToken,
} from "../../middlewares/authenticator";
import GoogleAuthenticator from "../../utils/google-authenticator";
import FacebookAuthenticator from "../../utils/facebook-authenticator";
import AppleAuthenticator from "../../utils/apple-authenticator";

// destructuring assignments
const { STANDARD } = USER_TYPES;

// variable initializations
const router = Router();

router.post(
  "/register",
  exceptionHandler(async (req: IRequest, res: Response) => {
    const args = req.pick(["email", "password", "name"]);
    args.type = STANDARD;
    const user: any = await authController.registerUser(args as User);
    res.json({ token: user.getSignedjwtToken() });
  }),
);

router.post(
  "/login",
  exceptionHandler(async (req: IRequest, res: Response) => {
    const args = req.pick(["email", "password"]);
    const response = await authController.loginUser(args as LoginDTO);
    res.json({ token: response });
  }),
);

router.post(
  "/logout",
  verifyUserToken,
  exceptionHandler(async (req: IRequest, res: Response) => {
    const { _id: user } = req.user;
    const args = { ...req.pick(["device"]), user, shallRemoveFCM: true };
    await userController.updateUserById(user, args);
    res.json({ message: "Operation completed successfully!" });
  }),
);

router
  .route("/password/email")
  .post(
    exceptionHandler(async (req: IRequest, res: Response) => {
      const args = req.pick(["email"]);
      await authController.emailResetPassword(args as SendEmailDTO);
      res.json({ message: "Operation completed successfully!" });
    }),
  )
  .put(
    exceptionHandler(async (req: IRequest, res: Response) => {
      const args = req.pick(["password", "user", "token"]);
      await authController.resetPassword(args as ResetPasswordDTO);
      res.json({ message: "Operation completed successfully!" });
    }),
  );

router.post(
  "/login/phone",
  verifyUserToken,
  verifyOTP,
  verifyUserToken,
  exceptionHandler(async (req: IRequest, res: Response) => {
    const { _id: user } = req.user;
    const args = { user };
    const response: any = await userController.getUser(args);
    res.json({ token: response.getSignedjwtToken() });
  }),
);

router.post(
  "/login/google",
  exceptionHandler(async (req: IRequest, res: Response) => {
    const { token, googleId } = req.body;
    const googleUser = await GoogleAuthenticator.authenticate(token, googleId);
    const args = { googleId, email: googleUser?.email };
    let user: any = await userController.getUser(args);
    if (!user) {
      const userObj = {
        googleId,
        email: googleUser?.email,
        firstName: googleUser?.given_name,
        lastName: googleUser?.family_name,
        type: USER_TYPES.STANDARD,
        password: userController.generateRandomPassword(),
        isPasswordSet: false,
      };
      user = await authController.registerUser(userObj);
    }
    res.json({ token: user.getSignedjwtToken() });
  }),
);

router.post(
  "/login/facebook",
  exceptionHandler(async (req: IRequest, res: Response) => {
    const { token, facebookId } = req.body;
    const facebookUser = await FacebookAuthenticator.authenticate(
      token,
      facebookId,
    );
    const args = { facebookId, email: facebookUser?.email };
    let user: any = await userController.getUser(args);
    if (!user) {
      const userObj = {
        facebookId,
        email: facebookUser?.email,
        firstName: facebookUser?.first_name,
        lastName: facebookUser?.last_name,
        type: USER_TYPES.STANDARD,
        password: userController.generateRandomPassword(),
        isPasswordSet: false,
      };
      user = await authController.registerUser(userObj);
    }
    res.json({ token: user.getSignedjwtToken() });
  }),
);

router.post(
  "/login/apple",
  exceptionHandler(async (req: IRequest, res: Response) => {
    const { token, appleId } = req.body;
    const appleUser = await AppleAuthenticator.authenticate(token, appleId);
    const args = { appleId, email: appleUser?.email };
    let user: any = await userController.getUser(args);
    if (!user) {
      const userObj = {
        appleId,
        email: appleUser?.email,
        type: USER_TYPES.STANDARD,
        password: userController.generateRandomPassword(),
        isPasswordSet: false,
      };
      user = await authController.registerUser(userObj);
    }
    res.json({ token: user.getSignedjwtToken() });
  }),
);

router.post(
  "/login/admin",
  exceptionHandler(async (req: IRequest, res: Response) => {
    const args = req.pick(["email", "password"]);
    const response = await authController.loginAdmin(args as LoginDTO);
    res.json({ token: response });
  }),
);

router.post(
  "/register/admin",
  verifyAPIKey,
  exceptionHandler(async (req: IRequest, res: Response) => {
    const args = req.pick(["email", "password", "type"]);
    if (!args.type) args.type = STANDARD;
    const response = await authController.registerAdmin(args as Admin);
    res.json({ token: response });
  }),
);

router.get(
  "/profile/user",
  verifyUserToken,
  exceptionHandler(async (req: IRequest, res: Response) => {
    const { _id: user } = req.user;
    const { device } = req.query;
    const args = { user, device: device?.toString() || "" };
    const response = await userController.getUserProfile(args);
    res.json(response);
  }),
);

router.get(
  "/profile/admin",
  verifyAdminToken,
  exceptionHandler(async (req: IRequest, res: Response) => {
    const { _id: admin } = req.admin;
    const adminExists = await adminController.getAdminById(admin);
    res.json(adminExists);
  }),
);

export default router;
