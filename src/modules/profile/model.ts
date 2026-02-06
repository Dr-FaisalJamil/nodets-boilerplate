// module imports
import { model, Schema } from "mongoose";

// file imports
import { MODEL_NAMES } from "../../configs/enum";

// variable initializations

const profileSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.USERS,
      required: true,
      index: true,
    },
    isDeleted: { type: Boolean, select: false, index: true },
  },
  { timestamps: true },
);

export default model(MODEL_NAMES.PROFILES, profileSchema);
