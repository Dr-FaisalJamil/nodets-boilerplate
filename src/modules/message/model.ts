// module imports
import { model, Schema } from "mongoose";

// file imports
import { MESSAGE_STATUSES, MODEL_NAMES } from "../../configs/enum";

// destructuring assignments

// variable initializations

const attachmentSchema = new Schema({
  key: { type: String, required: true },
  type: { type: String, required: true },
});

const messageSchema = new Schema(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.CONVERSATIONS,
      required: true,
      index: true,
    },
    userTo: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.USERS,
      required: true,
      index: true,
    },
    userFrom: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.USERS,
      required: true,
      index: true,
    },
    text: {
      type: String,
      trim: true,
    },
    attachments: [attachmentSchema],
    status: {
      type: String,
      enum: Object.values(MESSAGE_STATUSES),
      default: MESSAGE_STATUSES.UNREAD,
      required: true,
      index: true,
    },
    isDeleted: { type: Boolean, select: false, index: true },
  },
  { timestamps: true },
);

export default model(MODEL_NAMES.MESSAGES, messageSchema);
