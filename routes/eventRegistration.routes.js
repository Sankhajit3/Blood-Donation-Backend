import express from "express";
import {
  registerForEvent,
  checkEventRegistration,
  getEventRegistrations,
  getUserEventRegistrations,
  updateRegistrationStatus,
} from "../controllers/eventRegistration.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

// Register for an event
router.post("/:eventId/register", isAuthenticated, registerForEvent);

// Check if user is registered for an event
router.get(
  "/:eventId/check-registration",
  isAuthenticated,
  checkEventRegistration
);

// Get all registrations for an event (only for event creator)
router.get("/:eventId/registrations", isAuthenticated, getEventRegistrations);

// Get all events a user has registered for
router.get("/user-registrations", isAuthenticated, getUserEventRegistrations);

// Update registration status (only for event creator)
router.patch(
  "/:registrationId/status",
  isAuthenticated,
  updateRegistrationStatus
);

export default router;
