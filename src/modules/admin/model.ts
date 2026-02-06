// module imports
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { model, Schema } from "mongoose";

// file imports
import { ADMIN_TYPES, ACCOUNT_STATUSES, MODEL_NAMES } from "../../configs/enum";

// variable initializations

const adminSchema = new Schema(
  {
    email: {
      type: String,
      lowercase: true,
      trim: true,
      required: [true, "Please enter email address!"],
      unique: true,
      validate: {
        validator: function (v: string) {
          return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: (props: any) => `${props.value} is not a valid email address!`,
      },
      index: true,
    },
    password: {
      type: String,
      // required: [true, "Please enter password!"],
      required: true,
      select: false,
    },
    type: {
      type: String,
      enum: Object.values(ADMIN_TYPES),
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ACCOUNT_STATUSES),
      default: ACCOUNT_STATUSES.ACTIVE,
      index: true,
    },
    lastUsed: {
      type: Date,
      select: false,
    },
    lastLogin: {
      type: Date,
      select: false,
    },
    isDeleted: { type: Boolean, select: false, index: true },
  },
  { timestamps: true },
);

adminSchema.methods.getSignedjwtToken = function () {
  return jwt.sign(
    { _id: this._id, type: this.type },
    process.env.JWT_SECRET || "",
  );
};

adminSchema.methods.setPassword = async function (newPassword: string) {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(newPassword, salt);
  this.save();
};

adminSchema.methods.validatePassword = async function (
  enteredPassword: string,
) {
  const adminExists = await model(MODEL_NAMES.ADMINS, adminSchema)
    .findById(this._id, { password: 1 })
    .select("+password");
  return await bcrypt.compare(enteredPassword, adminExists?.password || "");
};

export default model(MODEL_NAMES.ADMINS, adminSchema);
