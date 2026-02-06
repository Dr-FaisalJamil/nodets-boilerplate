// module imports
import { model, Schema } from "mongoose";

// file imports
import { CONVERSATION_STATUSES, MODEL_NAMES } from "../../configs/enum";

// destructuring assignments

// variable initializations

const conversationSchema = new Schema(
  {
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
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.MESSAGES,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(CONVERSATION_STATUSES),
      default: CONVERSATION_STATUSES.PENDING,
      required: true,
      index: true,
    },
    isDeleted: { type: Boolean, select: false, index: true },
  },
  { timestamps: true },
);

export default model(MODEL_NAMES.CONVERSATIONS, conversationSchema);
