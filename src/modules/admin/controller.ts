// module imports
import { isValidObjectId } from "mongoose";

// file imports
import AdminModel from "./model";
import { Admin } from "./interface";
import { MongoID } from "../../configs/types";
import { ErrorHandler } from "../../middlewares/error-handler";

/**
 * @description Add admin
 * @param {Object} adminObj admin data
 * @returns {Object} admin data
 */
export const addAdmin = async (adminObj: Admin) => {
  const { password } = adminObj;
  const admin: any = await AdminModel.create(adminObj);
  await admin.setPassword(password);
  return admin;
};

/**
 * @description Update admin data
 * @param {string} admin admin id
 * @param {Object} adminObj admin data
 * @returns {Object} admin data
 */
export const updateAdminById = async (
  admin: MongoID,
  adminObj: Partial<Admin>,
) => {
  if (!admin) throw new ErrorHandler("Please enter admin id!", 400);
  if (!isValidObjectId(admin))
    throw new ErrorHandler("Please enter valid admin id!", 400);
  const adminExists = await AdminModel.findByIdAndUpdate(admin, adminObj, {
    new: true,
  });
  if (!adminExists) throw new ErrorHandler("admin not found!", 404);
  return adminExists;
};

/**
 * @description Get admin
 * @param {Object} query admin data
 * @returns {Object} admin data
 */
export const getAdmin = async (query: Partial<Admin>) => {
  if (!query || Object.keys(query).length === 0)
    throw new ErrorHandler("Please enter query!", 400);
  const adminExists = await AdminModel.findOne(query).select(
    "-createdAt -updatedAt -__v",
  );
  if (!adminExists) throw new ErrorHandler("admin not found!", 404);
  return adminExists;
};

/**
 * @description Get admin
 * @param {string} admin admin id
 * @returns {Object} admin data
 */
export const getAdminById = async (admin: MongoID) => {
  if (!admin) throw new ErrorHandler("Please enter admin id!", 400);
  if (!isValidObjectId(admin))
    throw new ErrorHandler("Please enter valid admin id!", 400);
  const adminExists = await AdminModel.findById(admin).select(
    "-createdAt -updatedAt -__v",
  );
  if (!adminExists) throw new ErrorHandler("admin not found!", 404);
  return adminExists;
};
