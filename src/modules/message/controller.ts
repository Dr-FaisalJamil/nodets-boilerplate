// module imports
import { isValidObjectId, Types } from "mongoose";

// file imports
import MessageModel from "./model";
import * as conversationController from "../conversation/controller";
import * as userController from "../user/controller";
import { Message } from "./interface";
import { GetMessagesDTO, SendMessageDTO } from "./dto";
import { sendNewMessageNotification } from "../notification/controller";
import { MongoID } from "../../configs/types";
import { MESSAGE_STATUSES } from "../../configs/enum";
import { ErrorHandler } from "../../middlewares/error-handler";

// destructuring assignments
const { READ } = MESSAGE_STATUSES;
const { ObjectId } = Types;

/**
 * @description Add message
 * @param {Object} messageObj message data
 * @returns {Object} message data
 */
export const addMessage = async (messageObj: Message) => {
  return await MessageModel.create(messageObj);
};

/**
 * @description Update message data
 * @param {string} message message id
 * @param {Object} messageObj message data
 * @returns {Object} message data
 */
export const updateMessageById = async (
  message: MongoID,
  messageObj: Partial<Message>,
) => {
  if (!message) throw new ErrorHandler("Please enter message id!", 400);
  if (!isValidObjectId(message))
    throw new ErrorHandler("Please enter valid message id!", 400);
  const messageExists = await MessageModel.findByIdAndUpdate(
    message,
    messageObj,
    { new: true },
  );
  if (!messageExists) throw new ErrorHandler("message not found!", 404);
  return messageExists;
};

/**
 * @description Get messages
 * @param {Object} params messages fetching parameters
 * @returns {Object[]} messages data
 */
export const getMessages = async (params: GetMessagesDTO) => {
  const { conversation, isDeleted } = params;
  let { page, limit, user1, user2 } = params;
  page = page - 1 || 0;
  limit = limit || 10;
  const query: any = {};
  if (typeof isDeleted === "boolean") query.isDeleted = isDeleted;
  if (conversation)
    query.conversation =
      typeof conversation === "string"
        ? new ObjectId(conversation)
        : conversation;
  else if (user1 && user2) {
    if (typeof user1 === "string") user1 = new ObjectId(user1);
    if (typeof user2 === "string") user2 = new ObjectId(user2);
    query.$or = [
      { $and: [{ userTo: user1 }, { userFrom: user2 }] },
      { $and: [{ userFrom: user1 }, { userTo: user2 }] },
    ];
  } else throw new ErrorHandler("Please enter conversation id!", 400);
  const [result] = await MessageModel.aggregate([
    { $match: query },
    { $sort: { createdAt: -1 } },
    { $project: { createdAt: 0, updatedAt: 0, __v: 0 } },
    {
      $facet: {
        totalCount: [{ $count: "totalCount" }],
        data: [{ $skip: page * limit }, { $limit: limit }],
      },
    },
    { $unwind: "$totalCount" },
    {
      $project: {
        totalCount: "$totalCount.totalCount",
        totalPages: { $ceil: { $divide: ["$totalCount.totalCount", limit] } },
        data: 1,
      },
    },
  ]);
  return { data: [], totalCount: 0, totalPages: 0, ...result };
};

/**
 * @description Send message
 * @param {Object} params send message data
 * @returns {Object} message data
 */
export const send = async (params: SendMessageDTO) => {
  const { username } = params;

  const conversation = await conversationController.addConversation(params);

  const message = await addMessage({
    ...params,
    conversation: conversation._id,
  });

  conversation.lastMessage = message._id;
  await conversation.save();

  conversation.lastMessage = message;

  const notificationData = {
    user: message.userTo.toString(),
    message: message._id.toString(),
    messenger: message.userFrom.toString(),
  };

  const args: any = {
    username,
    notificationData,
    messageData: message,
    conversationData: conversation,
  };
  await sendNewMessageNotification(args);

  return message;
};

/**
 * @description read all messages
 * @param {Object} params read messages data
 */
export const readMessages = async (params: Partial<Message>): Promise<void> => {
  let { conversation, userTo } = params;
  conversation = new ObjectId(conversation);
  userTo = new ObjectId(userTo);
  const messageObj = { status: READ };
  if (!userTo) throw new ErrorHandler("Please enter userTo id!", 400);
  if (!(await userController.checkUserExistence({ _id: userTo })))
    throw new ErrorHandler("Please enter valid userTo id!", 400);
  if (!conversation)
    throw new ErrorHandler("Please enter conversation id!", 400);
  if (!(await conversationController.getConversationById(conversation)))
    throw new ErrorHandler("Please enter valid conversation id!", 400);
  await MessageModel.updateMany({ conversation, userTo }, messageObj);
};
