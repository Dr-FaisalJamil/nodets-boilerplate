// module imports
import { isValidObjectId } from "mongoose";

// file imports
import ConversationModel from "./model";
import { Conversation } from "./interface";
import { GetConversationsDTO } from "./dto";
import { MongoID } from "../../configs/types";
import { CONVERSATION_STATUSES, MODEL_NAMES } from "../../configs/enum";
import { ErrorHandler } from "../../middlewares/error-handler";

// destructuring assignments
const { PENDING, ACCEPTED, REJECTED } = CONVERSATION_STATUSES;

/**
 * @description Add conversation
 * @param {Object} conversationObj conversation data
 * @returns {Object} conversation data
 */
export const addConversation = async (conversationObj: Conversation) => {
  const { userFrom, userTo } = conversationObj;
  const query = {
    $or: [
      { $and: [{ userTo: userFrom }, { userFrom: userTo }] },
      { $and: [{ userFrom }, { userTo }] },
    ],
  };

  let conversationExists: any = await ConversationModel.findOne(query);
  if (conversationExists) {
    if (conversationExists.status === PENDING) {
      if (userFrom === conversationExists.userTo.toString()) {
        conversationExists.status = ACCEPTED;
        await conversationExists.save();
      }
    } else if (conversationExists.status === REJECTED)
      throw new ErrorHandler("Conversation request rejected!", 400);
  } else {
    const conversationObj: any = {};
    conversationObj.userTo = userTo;
    conversationObj.userFrom = userFrom;
    conversationExists = await ConversationModel.create(conversationObj);
  }
  return conversationExists;
};

/**
 * @description Get conversation
 * @param {string} conversation conversation id
 * @returns {Object} conversation data
 */
export const getConversationById = async (conversation: MongoID) => {
  if (!conversation)
    throw new ErrorHandler("Please enter conversation id!", 400);
  if (!isValidObjectId(conversation))
    throw new ErrorHandler("Please enter valid conversation id!", 400);
  const conversationExists = await ConversationModel.findById(
    conversation,
  ).select("-createdAt -updatedAt -__v");
  if (!conversationExists)
    throw new ErrorHandler("conversation not found!", 404);
  return conversationExists;
};

/**
 * @description Get conversations
 * @param {Object} params conversations fetching parameters
 * @returns {Object[]} conversations data
 */
export const getConversations = async (params: GetConversationsDTO) => {
  const { user } = params;
  let { limit, page, keyword } = params;
  page = page - 1 || 0;
  limit = limit || 10;
  const query: any = {};
  const queryRegex: any = {};

  if (user) query.$or = [{ userTo: user }, { userFrom: user }];
  if (keyword) {
    keyword = keyword.trim();
    if (keyword !== "")
      queryRegex.$or = [
        { "lastMessage.text": { $regex: keyword, $options: "i" } },
        { "user.name": { $regex: keyword, $options: "i" } },
      ];
  }

  const [result] = await ConversationModel.aggregate([
    { $match: query },
    {
      $lookup: {
        from: MODEL_NAMES.MESSAGES,
        localField: "lastMessage",
        foreignField: "_id",
        as: "lastMessage",
        pipeline: [
          {
            $project: {
              text: 1,
              userFrom: 1,
              createdAt: 1,
              "attachments.type": 1,
            },
          },
        ],
      },
    },
    { $unwind: { path: "$lastMessage" } },
    { $sort: { "lastMessage.createdAt": -1 } },
    {
      $project: {
        user: {
          $cond: {
            if: { $eq: ["$userTo", user] },
            then: "$userFrom",
            else: "$userTo",
          },
        },
        lastMessage: 1,
      },
    },
    {
      $lookup: {
        from: MODEL_NAMES.USERS,
        localField: "user",
        foreignField: "_id",
        as: "user",
        pipeline: [{ $project: { name: 1, image: 1 } }],
      },
    },
    {
      $unwind: { path: "$user" },
    },
    { $match: queryRegex },
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
