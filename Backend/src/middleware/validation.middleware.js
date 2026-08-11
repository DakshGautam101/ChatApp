import { validationResult } from "express-validator";

const validate = (validations) => {
  return async (req, res, next) => {
    const validationList = Array.isArray(validations) ? validations : [validations];

    for (const validation of validationList) {
      await validation.run(req);
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const formattedErrors = {};
    errors.array().forEach((err) => {
      const field = err.path || err.param;
      if (field) {
        if (!formattedErrors[field]) {
          formattedErrors[field] = [];
        }
        formattedErrors[field].push(err.msg);
      }
    });

    return res.status(400).json({ success: false, errors: formattedErrors });
  };
};

export default validate;

