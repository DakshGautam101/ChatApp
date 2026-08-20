import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import type { ValidationChain } from "express-validator";

interface ValidationError extends Error{
  path ?: string,
  param ?: string
}

const validate = (validations : ValidationChain | ValidationChain[]) => {
  return async (req : Request, res :Response, next : NextFunction) => {
    const validationList = Array.isArray(validations) ? validations : [validations];

    for (const validation of validationList) {
      await validation.run(req);
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const errorArray = errors.array().map((err) => ({
      field: err.type === "field" ? err.path : "unknown",
      message: err.msg,
    }));

    const firstErrorMessage = errorArray[0]?.message || "Validation failed";

    return res.status(400).json({
      success: false,
      message: firstErrorMessage,
      errors: errorArray,
    });
  };
};

export default validate;

