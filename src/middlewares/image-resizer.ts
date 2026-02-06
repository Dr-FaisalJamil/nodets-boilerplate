// module imports
import { Response, NextFunction } from "express";

// file imports
import SharpManager from "../utils/sharp-manager";
import { exceptionHandler } from "./exception-handler";
import { IRequest } from "../configs/types";

// variable initializations

export const resizeImages = exceptionHandler(
  async (req: IRequest, _res: Response, next: NextFunction) => {
    const images = req.files || [];
    const image = req.file || {};
    if (images || image) {
      // imagesData contains 1.image_name 2.image_path
      const imagesData = images ?? [image];

      // req.files = await new SharpManager().resizeImagesWithThumbnails(
      //   imagesData
      // );
      next();
    } else next();
  },
);
