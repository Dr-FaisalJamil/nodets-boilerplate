// module imports
import { model, Schema } from "mongoose";

// file imports
import { MODEL_NAMES } from "../../configs/enum";

// variable initializations

const elementSchema = new Schema(
  { isDeleted: { type: Boolean, select: false, index: true } },
  { timestamps: true },
);

export default model(MODEL_NAMES.ELEMENTS, elementSchema);
