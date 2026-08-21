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
//# sourceMappingURL=validation.middleware.js.map