import express from "express";
import {
  createBloodRequest,
  getAllBloodRequests,
  getUserBloodRequests,
  getUserDeletedBloodRequests,
  updateBloodRequestStatus,
  respondToBloodRequest,
  getBloodRequestResponses,
  getUserResponses,
  updateResponseStatus,
  deleteBloodRequest,
} from "../controllers/bloodRequest.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

// Create blood request (Authenticated users)
router.post("/", isAuthenticated, createBloodRequest);

// Get all blood requests (Public or Authenticated)
router.get("/", getAllBloodRequests);

// Get blood requests by user (Authenticated users)
router.get("/my-requests", isAuthenticated, getUserBloodRequests);

// Get deleted blood requests by user (Authenticated users)
router.get(
  "/my-deleted-requests",
  isAuthenticated,
  getUserDeletedBloodRequests
);

// Get responses made by the current user (Authenticated users)
router.get("/my-responses", isAuthenticated, getUserResponses);

// Update blood request status (Admin/Hospital)
router.put("/:requestId/status", isAuthenticated, updateBloodRequestStatus);

// Respond to blood request (Authenticated users)
router.post("/:requestId/respond", isAuthenticated, respondToBloodRequest);

// Get responses for a blood request (Authenticated users)
router.get("/:requestId/responses", isAuthenticated, getBloodRequestResponses);

// Update response status (for request creators - hospital, organization, admin)
router.put(
  "/responses/:responseId/status",
  isAuthenticated,
  updateResponseStatus
);

// Delete blood request (for request creators only)
router.delete("/:requestId", isAuthenticated, deleteBloodRequest);

export default router;
