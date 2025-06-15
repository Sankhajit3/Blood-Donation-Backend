// Utility function to validate ObjectId
export const validateObjectId = (id, fieldName = "ID") => {
  if (!id || id === "undefined" || id === "null") {
    return {
      isValid: false,
      error: `Invalid or missing ${fieldName.toLowerCase()}`,
    };
  }

  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    return {
      isValid: false,
      error: `Invalid ${fieldName.toLowerCase()} format`,
    };
  }

  return { isValid: true };
};

// Middleware to validate ObjectId parameters
export const validateObjectIdMiddleware = (
  paramName = "id",
  fieldName = "ID"
) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    const validation = validateObjectId(id, fieldName);

    if (!validation.isValid) {
      return res.status(400).json({
        message: validation.error,
        success: false,
      });
    }

    next();
  };
};
