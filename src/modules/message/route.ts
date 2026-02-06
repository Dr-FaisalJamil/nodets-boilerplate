// module imports
import { Request, Response, Router } from "express";

// file imports
import * as messageController from "./controller";
import * as conversationController from "../conversation/controller";
import { verifyUserToken } from "../../middlewares/authenticator";
import { exceptionHandler } from "../../middlewares/exception-handler";
import { IRequest } from "../../configs/types";

// destructuring assignments

// variable initializations
const router = Router();

router
  .route("/")
  .all(verifyUserToken)
  .post(
    exceptionHandler(async (req: IRequest, res: Response) => {
      const { _id: userFrom, name: username } = req.user;
      const args: any = {
        ...req.pick(["user", "text", "attachments"]), // {attachments: {key: string, type: string}[]}
        userFrom,
        username,
      };
      args.userTo = args.user;
      const response = await messageController.send(args);
      res.json(response);
    }),
  )
  .get(
    exceptionHandler(async (req: IRequest, res: Response) => {
      const { _id: user1 } = req.user;
      const { limit, page, user, isDeleted } = req.query;
      let { conversation } = req.query;
      conversation = conversation?.toString() || "";
      const user2 = user?.toString() || "";
      const args = {
        conversation,
        user1,
        user2,
        limit: Number(limit),
        page: Number(page),
        isDeleted: JSON.parse(String(isDeleted || "null")),
      };
      const response = await messageController.getMessages(args);
      res.json(response);
    }),
  )
  .put(
    exceptionHandler(async (req: IRequest, res: Response) => {
      let { message } = req.query;
      const args = req.pick(["text", "status"]);
      message = message?.toString() || "";
      const response = await messageController.updateMessageById(message, args);
      res.json(response);
    }),
  )
  .patch(
    exceptionHandler(async (req: IRequest, res: Response) => {
      const { _id: userTo } = req.user;
      const args = { ...req.pick(["conversation"]), userTo };
      await messageController.readMessages(args);
      res.json({ message: "Operation completed successfully!" });
    }),
  );

router.get(
  "/conversation",
  verifyUserToken,
  exceptionHandler(async (req: IRequest, res: Response) => {
    const { _id: user } = req.user;
    const { limit, page } = req.query;
    let { keyword } = req.query;
    keyword = keyword?.toString() || "";
    const args = {
      user,
      limit: Number(limit),
      page: Number(page),
      keyword,
    };
    const response = await conversationController.getConversations(args);
    res.json(response);
  }),
);

export default router;
