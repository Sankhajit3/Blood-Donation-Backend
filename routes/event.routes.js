import express from "express";
import {
  createEvent,
  getAllEvents,
  getMyEvents,
  updateEvent,
  deleteEvent,
} from "../controllers/event.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { singleUpload } from "../middlewares/multer.js";

const router = express.Router();

// Create event (with image upload)
router.post("/create", isAuthenticated, singleUpload, createEvent);

// Get all events (public)
router.get("/", getAllEvents);

// Get events created by current user
router.get("/my-events", isAuthenticated, getMyEvents);

// Update event (with optional image upload)
router.put("/:id", isAuthenticated, singleUpload, updateEvent);

// Delete event
router.delete("/:id", isAuthenticated, deleteEvent);

export default router;