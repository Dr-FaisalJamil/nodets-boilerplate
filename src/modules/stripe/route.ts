// module imports
import { Request, Response, Router } from "express";

// file imports
import StripeManager from "../../utils/stripe-manager";
import { exceptionHandler } from "../../middlewares/exception-handler";
import { IRequest } from "../../configs/types";
import {
  verifyUserToken,
  verifyAdminToken,
} from "../../middlewares/authenticator";

// destructuring assignments

// variable initializations
const router = Router();

router.post(
  "/transfers",
  verifyAdminToken,
  exceptionHandler(async (req: IRequest, res: Response) => {
    const args = req.pick(["user", "amount", "description"]);
    const response = await StripeManager.createTransfer(args);
    res.json(response);
  }),
);

router.post(
  "/account-link",
  verifyUserToken,
  exceptionHandler(async (req: IRequest, res: Response) => {
    const { _id: user, email } = req.user;
    const args = { ...req.pick(["account"]), user, email };
    const response = await StripeManager.createAccountLink(args);
    res.json(response);
  }),
);

router.post(
  "/webhook/external-account",
  exceptionHandler(async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"];
    const rawBody = req.body;
    // console.log("SIGNATURE: ", JSON.stringify(signature));
    // console.log("RAW_BODY: ", JSON.stringify(rawBody));
    const args = { rawBody, signature };
    const event = await StripeManager.constructWebhooksEvent(args);
    return res.status(200).send({
      message: "Done",
      event,
    });
  }),
);

export default router;
