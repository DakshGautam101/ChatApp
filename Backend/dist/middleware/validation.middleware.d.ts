import type { NextFunction, Request, Response } from "express";
import type { ValidationChain } from "express-validator";
declare const validate: (validations: ValidationChain | ValidationChain[]) => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export default validate;
//# sourceMappingURL=validation.middleware.d.ts.map