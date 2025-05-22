import express from "express";
import {
  createBloodRequest,
  getAllBloodRequests,
  getUserBloodRequests,
  updateBloodRequestStatus,
} from "../controllers/bloodRequest.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

// Create blood request (Authenticated users)
router.post("/", isAuthenticated, createBloodRequest);

// Get all blood requests (Public or Authenticated)
router.get("/", getAllBloodRequests);

// Get blood requests by user (Authenticated users)
router.get("/my-requests", isAuthenticated, getUserBloodRequests);

// Update blood request status (Admin/Hospital)
router.put("/:requestId/status", isAuthenticated, updateBloodRequestStatus);

export default router;