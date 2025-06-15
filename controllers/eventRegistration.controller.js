import Event from "../models/event.model.js";
import EventRegistration from "../models/eventRegistration.model.js";
import {
  canUserDonate,
  updateDonationStatus,
} from "../utils/donationStatus.js";

// Register for an event
export const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    // Check if user can donate based on their donation status
    const donationCheck = await canUserDonate(userId);
    if (!donationCheck.canDonate) {
      return res.status(400).json({
        message: `Cannot register for event: ${donationCheck.reason}`,
        success: false,
        nextEligibleDate: donationCheck.nextEligibleDate || null,
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        message: "Event not found",
        success: false,
      });
    }

    // Check if user created this event - can't register for own event
    if (event.createdBy.toString() === userId.toString()) {
      return res.status(400).json({
        message: "You cannot register for an event that you created",
        success: false,
      });
    }

    // Check if user already registered for this event
    const existingRegistration = await EventRegistration.findOne({
      event: eventId,
      user: userId,
    });

    if (existingRegistration) {
      return res.status(400).json({
        message: "You have already registered for this event",
        success: false,
      });
    }

    // Check if event is at registration limit
    if (
      event.registrationLimit &&
      event.registeredCount >= event.registrationLimit
    ) {
      return res.status(400).json({
        message: "Registration limit reached for this event",
        success: false,
      });
    }

    // Create a new registration
    const eventRegistration = new EventRegistration({
      event: eventId,
      user: userId,
      registrationDate: new Date(),
    });

    await eventRegistration.save();

    // Increment the registeredCount in the event
    event.registeredCount = (event.registeredCount || 0) + 1;
    await event.save();

    res.status(201).json({
      message: "Successfully registered for event",
      success: true,
      registration: eventRegistration,
    });
  } catch (error) {
    console.error("Event registration error:", error);
    res.status(500).json({
      message: "Server error while registering for event",
      success: false,
    });
  }
};

// Check if user is registered for an event
export const checkEventRegistration = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    const registration = await EventRegistration.findOne({
      event: eventId,
      user: userId,
    });

    res.status(200).json({
      isRegistered: !!registration,
      status: registration?.status || null,
      registrationId: registration?._id || null,
      success: true,
    });
  } catch (error) {
    console.error("Check registration error:", error);
    res.status(500).json({
      message: "Server error while checking registration",
      success: false,
    });
  }
};

// Get all registrations for an event
export const getEventRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    // Check if the user is the event creator
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        message: "Event not found",
        success: false,
      });
    }

    // Only allow event creator to see registrations
    if (event.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "You don't have permission to view these registrations",
        success: false,
      });
    }
    const registrations = await EventRegistration.find({ event: eventId })
      .populate("user", "name email phone hospitalName organizationName role")
      .sort({ registrationDate: -1 });

    res.status(200).json({
      registrations,
      success: true,
    });
  } catch (error) {
    console.error("Get event registrations error:", error);
    res.status(500).json({
      message: "Server error while fetching registrations",
      success: false,
    });
  }
};

// Get all events a user has registered for
export const getUserEventRegistrations = async (req, res) => {
  try {
    const userId = req.user._id;

    const registrations = await EventRegistration.find({ user: userId })
      .populate({
        path: "event",
        populate: {
          path: "createdBy",
          select:
            "name email profile.profilePhoto hospitalName organizationName role",
        },
      })
      .sort({ registrationDate: -1 });

    res.status(200).json({
      registrations,
      success: true,
    });
  } catch (error) {
    console.error("Get user registrations error:", error);
    res.status(500).json({
      message: "Server error while fetching your registrations",
      success: false,
    });
  }
};

// Update registration status (accept/reject)
export const updateRegistrationStatus = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    // Validate status
    if (!["Pending", "Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        message:
          "Invalid status. Status must be 'Pending', 'Approved', or 'Rejected'",
        success: false,
      });
    }

    // Find the registration
    const registration = await EventRegistration.findById(
      registrationId
    ).populate("event");

    if (!registration) {
      return res.status(404).json({
        message: "Registration not found",
        success: false,
      });
    }

    // Check if user is the event creator
    const event = await Event.findById(registration.event);
    if (!event) {
      return res.status(404).json({
        message: "Event not found",
        success: false,
      });
    }

    // Only allow event creator to update registration status
    if (event.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "You don't have permission to update this registration",
        success: false,
      });
    }

    // Prevent changes to already approved registrations
    if (registration.status === "Approved") {
      return res.status(400).json({
        message: "Cannot change status of an already approved registration",
        success: false,
      });
    }

    // If rejecting a registration, delete it completely to vacate the status
    if (status === "Rejected") {
      await EventRegistration.findByIdAndDelete(registrationId);

      // Decrement the registeredCount in the event
      event.registeredCount = Math.max((event.registeredCount || 1) - 1, 0);
      await event.save();

      res.status(200).json({
        message: "Registration rejected and removed",
        success: true,
      });
    } else {
      // Update the registration status for approved/pending
      registration.status = status;
      await registration.save();

      // If status is being changed to "Approved", update user's donation status
      if (status === "Approved") {
        try {
          await updateDonationStatus(registration.user);
          console.log(
            `Updated donation status for user ${registration.user} after event approval`
          );
        } catch (donationError) {
          console.error("Error updating donation status:", donationError);
          // Continue with the response even if donation status update fails
        }
      }

      res.status(200).json({
        message: `Registration status updated to ${status}`,
        registration,
        success: true,
      });
    }
  } catch (error) {
    console.error("Update registration status error:", error);
    res.status(500).json({
      message: "Server error while updating registration status",
      success: false,
    });
  }
};
