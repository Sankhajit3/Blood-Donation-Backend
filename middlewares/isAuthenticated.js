import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const isAuthenticated = async (req, res, next) => {
  try {
    // Get token from cookies or Authorization header
    let token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    // If no token is provided, reject request
    if (!token || token === "null" || token === "undefined") {
      return res.status(401).json({
        message: "User not authenticated - no valid token provided",
        success: false,
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({
        message: "Invalid token",
        success: false,
      });
    }

    // Fetch full user object to get role and other details
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found",
        success: false,
      });
    }

    // Attach full user object to request
    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
      success: false,
    });
  }
};

export default isAuthenticated;
