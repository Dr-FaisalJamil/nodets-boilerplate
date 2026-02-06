// module imports
import { Request, Response, Router } from "express";

// file imports
import * as elementController from "./controller";
import { exceptionHandler } from "../../middlewares/exception-handler";
import { IRequest } from "../../configs/types";
import {
  verifyUserToken,
  verifyAdminToken,
} from "../../middlewares/authenticator";

// destructuring assignments

// variable initializations
const router = Router();

router.get(
  "/",
  verifyUserToken,
  exceptionHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query;
    let { keyword } = req.query;
    keyword = keyword?.toString() || "";
    const args = {
      keyword,
      limit: Number(limit),
      page: Number(page),
    };
    const response = await elementController.getElements(args);
    res.json(response);
  }),
);

router
  .route("/admin")
  .all(verifyAdminToken)
  .post(
    exceptionHandler(async (req: IRequest, res: Response) => {
      const args = req.pick(["title", "description"]);
      const response = await elementController.addElement(args);
      res.json(response);
    }),
  )
  .put(
    exceptionHandler(async (req: IRequest, res: Response) => {
      let { element } = req.query;
      const args = req.pick(["title", "description"]);
      element = element?.toString() || "";
      const response = await elementController.updateElementById(element, args);
      res.json(response);
    }),
  )
  .patch(
    exceptionHandler(async (req: Request, res: Response) => {
      let { element } = req.query;
      const { isDeleted } = req.body;
      element = element?.toString() || "";
      const response = await elementController.updateElementById(element, {
        isDeleted,
      });
      res.json(response);
    }),
  )
  .get(
    exceptionHandler(async (req: Request, res: Response) => {
      const { page, limit, isDeleted } = req.query;
      let { keyword } = req.query;
      keyword = keyword?.toString() || "";
      const args = {
        keyword,
        limit: Number(limit),
        page: Number(page),
        isDeleted: JSON.parse(String(isDeleted || "null")),
      };
      const response = await elementController.getElements(args);
      res.json(response);
    }),
  )
  .delete(
    exceptionHandler(async (req: Request, res: Response) => {
      let { element } = req.query;
      element = element?.toString() || "";
      const response = await elementController.deleteElementById(element);
      res.json(response);
    }),
  );

router.get(
  "/:element",
  verifyAdminToken,
  exceptionHandler(async (req: Request, res: Response) => {
    const { element } = req.params;
    const response = await elementController.getElementById(element);
    res.json(response);
  }),
);

export default router;
