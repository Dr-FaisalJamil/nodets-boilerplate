// module imports
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { model, Schema } from "mongoose";

// file imports
import {
  ACCOUNT_STATUSES,
  USER_TYPES,
  GEO_JSON_TYPES,
  MODEL_NAMES,
} from "../../configs/enum";

// variable initializations

const userSchema = new Schema(
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
      required: true,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      index: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    fcm: {
      type: String,
      trim: true,
    },
    device: {
      type: String,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: Object.values(GEO_JSON_TYPES),
        default: GEO_JSON_TYPES.POINT,
        required: true,
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
        required: true,
      },
    },
    type: {
      type: String,
      enum: Object.values(USER_TYPES),
      default: USER_TYPES.STANDARD,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ACCOUNT_STATUSES),
      default: ACCOUNT_STATUSES.ACTIVE,
      index: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPasswordSet: {
      type: Boolean,
      default: true,
      select: false,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
      required: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: true,
      select: false,
      required: true,
    },
    lastUsed: {
      type: Date,
      select: false,
    },
    lastLogin: {
      type: Date,
      select: false,
    },
    profile: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.PROFILES,
      select: false,
      index: true,
    },
    googleId: {
      type: String,
      trim: true,
    },
    facebookId: {
      type: String,
      trim: true,
    },
    otp: {
      type: String,
      select: false,
    },
  },
  { timestamps: true },
);

userSchema.methods.getSignedjwtToken = function () {
  return jwt.sign(
    { _id: this._id, type: this.type },
    process.env.JWT_SECRET || "",
  );
};

userSchema.methods.populate = async function (field: string) {
  return await model(MODEL_NAMES.USERS, userSchema)
    .findById(this._id)
    .populate(field ?? this.type);
};

userSchema.methods.setPassword = async function (newPassword: string) {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(newPassword, salt);
  this.save();
};

userSchema.methods.validatePassword = async function (enteredPassword: string) {
  const userExists = await model(MODEL_NAMES.USERS, userSchema)
    .findById(this._id, { password: 1 })
    .select("+password");
  return await bcrypt.compare(enteredPassword, userExists?.password || "");
};

export default model(MODEL_NAMES.USERS, userSchema);
