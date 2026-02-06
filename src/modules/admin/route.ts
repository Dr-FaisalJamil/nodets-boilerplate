// module imports
import { Request, Response, Router } from "express";

// file imports
import * as adminController from "./controller";
import { IRequest } from "../../configs/types";
import { exceptionHandler } from "../../middlewares/exception-handler";
import {
  verifyAPIKey,
  verifyAdminToken,
} from "../../middlewares/authenticator";

// destructuring assignments

// variable initializations
const router = Router();

router.delete(
  "/clean/DB",
  verifyAdminToken,
  verifyAPIKey,
  exceptionHandler(async (_req: Request, res: Response) => {
    res.json({ message: "Operation completed successfully!" });
  }),
);

router.put(
  "/profile",
  verifyAdminToken,
  exceptionHandler(async (req: IRequest, res: Response) => {
    const { _id: admin } = req.admin;
    const args = req.pick(["email"]);
    const response = await adminController.updateAdminById(admin, args);
    res.json(response);
  }),
);

export default router;
