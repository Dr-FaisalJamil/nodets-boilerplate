// module imports
import { Request, Response, NextFunction } from "express";

// file imports
import { IRequest } from "../configs/types";

export default (req: Request, _res: Response, next: NextFunction) => {
  (req as IRequest).pick = (keys: string[]) =>
    Object.fromEntries(
      keys.map((key) => [
        key,
        req?.body?.[key] ?? req?.query?.[key] ?? req?.params?.[key],
      ]),
    );
  next();
};
