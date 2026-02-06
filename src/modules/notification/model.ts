// module imports
import { model, Schema } from "mongoose";

// file imports
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_STATUSES,
  MODEL_NAMES,
} from "../../configs/enum";

// destructuring assignments

// variable initializations

const notificationSchema = new Schema(
  {
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: true,
      index: true,
    },
    text: {
      type: String,
      default: "",
    },
    message: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.MESSAGES,
      index: true,
    },
    messenger: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.USERS,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.USERS,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(NOTIFICATION_STATUSES),
      default: NOTIFICATION_STATUSES.UNREAD,
    },
    isDeleted: { type: Boolean, select: false, index: true },
  },
  { timestamps: true },
);

export default model(MODEL_NAMES.NOTIFICATIONS, notificationSchema);
