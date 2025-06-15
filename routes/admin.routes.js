import express from "express";
import {
  getDashboardStats,
  getAllUsersForAdmin,
  updateUserStatus,
  deleteUserByAdmin,
  getAllEventsForAdmin,
  updateEventStatus,
  deleteEventByAdmin,
  getAllBloodRequestsForAdmin,
  updateBloodRequestStatusByAdmin,
  deleteBloodRequestByAdmin,
  getAllPostsForAdmin,
  deletePostByAdmin,
} from "../controllers/admin.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({
      message: "Access denied. Admin privileges required.",
      success: false,
    });
  }
};

// Dashboard
router.get("/dashboard/stats", isAuthenticated, isAdmin, getDashboardStats);

// Test basic connectivity (no admin required)
router.get("/test-basic", isAuthenticated, (req, res) => {
  res.json({
    message: "Basic authentication verified",
    success: true,
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      isAdmin: req.user.role === "admin",
    },
  });
});

// User Management
router.get("/users", isAuthenticated, isAdmin, getAllUsersForAdmin);
router.put("/users/:userId/status", isAuthenticated, isAdmin, updateUserStatus);
router.delete("/users/:userId", isAuthenticated, isAdmin, deleteUserByAdmin);

// Event Management
router.get("/events", isAuthenticated, isAdmin, getAllEventsForAdmin);
router.put(
  "/events/:eventId/status",
  isAuthenticated,
  isAdmin,
  updateEventStatus
);
router.delete("/events/:eventId", isAuthenticated, isAdmin, deleteEventByAdmin);

// Blood Request Management
router.get(
  "/blood-requests",
  isAuthenticated,
  isAdmin,
  getAllBloodRequestsForAdmin
);
router.put(
  "/blood-requests/:requestId/status",
  isAuthenticated,
  isAdmin,
  updateBloodRequestStatusByAdmin
);
router.delete(
  "/blood-requests/:requestId",
  isAuthenticated,
  isAdmin,
  deleteBloodRequestByAdmin
);

// Post Management
router.get("/posts", isAuthenticated, isAdmin, getAllPostsForAdmin);
router.delete("/posts/:postId", isAuthenticated, isAdmin, deletePostByAdmin);

export default router;
