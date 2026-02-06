// module imports
import { model, Schema } from "mongoose";

// file imports
import { PAYMENT_ACCOUNT_TYPES, MODEL_NAMES } from "../../configs/enum";

// destructuring assignments

// variable initializations

const paymentAccountSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.USERS,
      required: true,
      index: true,
    },
    account: {
      type: Object,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(PAYMENT_ACCOUNT_TYPES),
      required: true,
      index: true,
    },
    isDeleted: { type: Boolean, select: false, index: true },
  },
  { timestamps: true },
);

export default model(MODEL_NAMES.PAYMENT_ACCOUNTS, paymentAccountSchema);
