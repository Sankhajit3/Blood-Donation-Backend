// errorHandler.js - Global error handling middleware
import mongoose from "mongoose";

export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Handle mongoose validation errors
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = {};

    // Format validation errors
    for (const field in err.errors) {
      errors[field] = err.errors[field].message;
    }

    return res.status(400).json({
      message: "Validation failed",
      errors,
      success: false,
    });
  }

  // Handle cast errors (invalid ObjectID)
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      message: `Invalid ${err.path}: ${err.value}`,
      success: false,
    });
  }

  // Handle duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    return res.status(409).json({
      message: `${field} '${value}' already exists`,
      success: false,
    });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      message: "Invalid token",
      success: false,
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      message: "Token expired",
      success: false,
    });
  }

  // Default error handler for unhandled errors
  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong on the server";

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === "production" ? "🥞" : err.stack,
    success: false,
  });
};

export default errorHandler;
