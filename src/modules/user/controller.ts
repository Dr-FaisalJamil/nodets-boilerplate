// module imports
import { isValidObjectId } from "mongoose";

// file imports
import UserModel from "./model";
import FilesRemover from "../../utils/files-remover";
import * as profileController from "../profile/controller";
import { User } from "./interface";
import { MongoID } from "../../configs/types";
import { ErrorHandler } from "../../middlewares/error-handler";
import {
  GetUsersDTO,
  getUserDTO,
  getUserProfileDTO,
  updateUserDTO,
} from "./dto";

/**
 * @description Add user
 * @param {Object} userObj user data
 * @returns {Object} user data
 */
export const addUser = async (userObj: User) => {
  const { password, firstName, lastName } = userObj;
  if (firstName || lastName) {
    userObj.name = (firstName || "") + " " + (lastName || "");
  }
  const user: any = await UserModel.create(userObj as any);
  await user.setPassword(password);
  return user;
};

/**
 * @description Update user data
 * @param {string} user user id
 * @param {Object} userObj user data
 * @returns {Object} user data
 */
export const updateUserById = async (user: MongoID, userObj: updateUserDTO) => {
  if (!user) throw new ErrorHandler("Please enter user id!", 400);
  if (!isValidObjectId(user))
    throw new ErrorHandler("Please enter valid user id!", 400);
  const {
    password,
    firstName,
    lastName,
    image,
    profile,
    coordinates,
    fcm,
    device,
    shallRemoveFCM,
    isDeleted,
  } = userObj;

  if (!user) throw new ErrorHandler("Please enter user id!", 400);
  if (!isValidObjectId(user))
    throw new ErrorHandler("Please enter valid user id!", 400);

  const userExists: any = await UserModel.findById(user);
  if (!userExists) throw new ErrorHandler("User not found!", 404);

  if (password) {
    await userExists.setPassword(password);
    userObj.isPasswordSet = true;
    delete userObj.password;
  }
  if (fcm) {
    await UserModel.updateOne({ fcm }, { fcm: "" });
  }
  if (device) {
    await UserModel.updateOne({ device }, { device: "" });
  }
  if (shallRemoveFCM) {
    userObj.fcm = "";
  }
  if (firstName || lastName) {
    userObj.name = (firstName || "") + " " + (lastName || "");
  }
  if (image) {
    if (userExists.image) FilesRemover.remove([userExists.image]);
  }
  if (coordinates) {
    if (coordinates?.length === 2) {
      userExists.location.coordinates = coordinates;
      userObj.location = userExists.location;
    } else
      throw new ErrorHandler(
        "Please enter location longitude and latitude both!",
        400,
      );
  }
  if (profile)
    if (await profileController.checkProfileExistence({ _id: profile })) {
      userObj.profile = profile;
    } else throw new ErrorHandler("Profile not found!", 404);
  if (isDeleted) {
    if (userExists?.email) {
      userObj.email = `${userExists.email}_${userExists._id}`;
    }
  }
  return await UserModel.findByIdAndUpdate(userExists._id, userObj, {
    new: true,
  }).select("-createdAt -updatedAt -__v");
};

/**
 * @description Update user data
 * @param {Object} query user data
 * @param {Object} userObj user data
 * @returns {Object} user data
 */
export const updateUser = async (
  query: Partial<User>,
  userObj: Partial<User>,
) => {
  if (!query || Object.keys(query).length === 0)
    throw new ErrorHandler("Please enter query!", 400);
  const userExists = await UserModel.findOneAndUpdate(query, userObj, {
    new: true,
  });
  if (!userExists) throw new ErrorHandler("user not found!", 404);
  return userExists;
};

/**
 * @description Delete user
 * @param {string} user user id
 * @returns {Object} user data
 */
export const deleteUserById = async (user: MongoID) => {
  if (!user) throw new ErrorHandler("Please enter user id!", 400);
  if (!isValidObjectId(user))
    throw new ErrorHandler("Please enter valid user id!", 400);
  const userExists = await UserModel.findByIdAndDelete(user);
  if (!userExists) throw new ErrorHandler("user not found!", 404);
  return userExists;
};

/**
 * @description Get user
 * @param {string} user user id
 * @returns {Object} user data
 */
export const getUserById = async (user: MongoID) => {
  if (!user) throw new ErrorHandler("Please enter user id!", 400);
  if (!isValidObjectId(user))
    throw new ErrorHandler("Please enter valid user id!", 400);
  const userExists = await UserModel.findById(user).select(
    "-createdAt -updatedAt -__v",
  );
  if (!userExists) throw new ErrorHandler("user not found!", 404);
  return userExists;
};

/**
 * @description Get user
 * @param {Object} params user data
 * @returns {Object} user data
 */
export const getUser = async (params: getUserDTO) => {
  const { user, email, phone, googleId, facebookId, appleId, selection } =
    params;
  const query: any = {};
  if (user) query._id = user;
  if (email) query.email = email;
  if (googleId) query.$and = [{ googleId }, { email }];
  if (facebookId) query.$and = [{ facebookId }, { email }];
  if (appleId) query.$and = [{ appleId }, { email }];
  if (phone) query.phone = phone;
  if (Object.keys(query).length === 0) query._id = null;

  let userExists = await UserModel.findOne(query).select(
    selection || "-createdAt -updatedAt -__v -fcm",
  );
  if (userExists)
    if (userExists?.profile)
      userExists = await userExists.populate(userExists.type);
  return userExists;
};

/**
 * @description Get users
 * @param {Object} params users fetching parameters
 * @returns {Object[]} users data
 */
export const getUsers = async (params: GetUsersDTO) => {
  const { type, user, isDeleted } = params;
  let { page, limit, keyword } = params;
  page = page - 1 || 0;
  limit = limit || 10;
  const query: any = {};

  if (type) query.type = type;
  if (user) query._id = { $ne: user };
  if (typeof isDeleted === "boolean") query.isDeleted = isDeleted;
  if (keyword) {
    keyword = keyword.trim();
    if (keyword !== "")
      query.$or = [
        { email: { $regex: keyword, $options: "i" } },
        { name: { $regex: keyword, $options: "i" } },
      ];
  }
  const [result] = await UserModel.aggregate([
    { $match: query },
    { $sort: { createdAt: -1 } },
    { $project: { password: 0, createdAt: 0, updatedAt: 0, __v: 0 } },
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
 * @description Check user existence
 * @param {Object} query user data
 * @returns {boolean} user existence status
 */
export const checkUserExistence = async (query: Partial<User>) => {
  if (!query || Object.keys(query).length === 0)
    throw new ErrorHandler("Please enter query!", 400);
  return await UserModel.exists(query);
};

/**
 * @description Get user profile
 * @param {Object} params user fetching parameters
 * @returns {Object} user data
 */
export const getUserProfile = async (params: getUserProfileDTO) => {
  const { user } = params;
  return await UserModel.findById(user).select("-createdAt -updatedAt -__v");
};

/**
 * Generates a random password of a specified length.
 * @param {number} [length=12] The length of the password to generate.
 * @returns {string} A randomly generated password.
 */
export const generateRandomPassword = (length = 12) => {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+[]{}<>?";
  const allChars = lowercase + uppercase + numbers + symbols;
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomChar = allChars[Math.floor(Math.random() * allChars.length)];
    password += randomChar;
  }
  return password;
};
