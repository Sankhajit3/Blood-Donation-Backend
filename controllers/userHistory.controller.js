import BloodRequest from "../models/bloodRequest.model.js";
import BloodRequestResponse from "../models/bloodRequestResponse.model.js";
import Donor from "../models/donor.model.js";
import EventRegistration from "../models/eventRegistration.model.js";

// Get user's interaction history with hospitals
export const getHospitalHistory = async (req, res) => {
  try {
    const userId = req.user._id; // From isAuthenticated middleware

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    // Get all interactions with hospitals
    const hospitalInteractions = [];

    // 1. Get donations made to hospitals (from Donor collection)
    const donations = await Donor.find({ user: userId })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    // 2. Get blood requests made to hospitals
    const bloodRequests = await BloodRequest.find({
      createdBy: userId,
      isDeleted: false,
    }).sort({ createdAt: -1 }); // 3. Get responses to hospital blood requests
    const responsesByUser = await BloodRequestResponse.find({
      donor: userId,
    })
      .populate({
        path: "bloodRequest",
        populate: {
          path: "createdBy",
          select: "role hospitalName name",
        },
      })
      .sort({ createdAt: -1 });

    // 4. Get event registrations for hospital events
    const eventRegistrations = await EventRegistration.find({ user: userId })
      .populate({
        path: "event",
        populate: {
          path: "createdBy",
          select: "role hospitalName name",
        },
      })
      .sort({ createdAt: -1 });

    // Process donations
    donations.forEach((donation) => {
      hospitalInteractions.push({
        id: donation._id.toString(),
        type: "donation",
        hospitalName: "Blood Donation Center", // Default name as donors don't specify hospital
        interactionDate: donation.createdAt,
        bloodType: donation.bloodType,
        units: 1,
        status: "completed",
        details: {
          donorName: donation.name,
          weight: donation.weight,
          hemoglobin: donation.hemoglobinCount,
          phone: donation.phone,
        },
      });
    });

    // Process blood requests made by user
    bloodRequests.forEach((request) => {
      hospitalInteractions.push({
        id: request._id.toString(),
        type: "blood_request",
        hospitalName: request.hospital,
        interactionDate: request.createdAt,
        bloodType: request.bloodType,
        units: request.unitsRequired,
        status: request.status.toLowerCase(),
        details: {
          patientName: request.patientName,
          urgency: request.urgency,
          reason: request.reason,
          contactNumber: request.contactNumber,
          location: request.location,
        },
      });
    });

    // Process responses to hospital blood requests
    responsesByUser.forEach((response) => {
      if (
        response.bloodRequest &&
        response.bloodRequest.createdBy &&
        response.bloodRequest.createdBy.role === "hospital"
      ) {
        hospitalInteractions.push({
          id: response._id.toString(),
          type: "blood_response",
          hospitalName:
            response.bloodRequest.createdBy.hospitalName || "Hospital",
          interactionDate: response.createdAt,
          bloodType: response.bloodRequest.bloodType,
          units: response.bloodRequest.unitsRequired,
          status: response.status.toLowerCase(),
          details: {
            patientName: response.bloodRequest.patientName,
            responseMessage: response.message,
            contactNumber: response.contactNumber,
          },
        });
      }
    });

    // Process hospital event registrations
    eventRegistrations.forEach((registration) => {
      if (
        registration.event &&
        registration.event.createdBy &&
        registration.event.createdBy.role === "hospital"
      ) {
        hospitalInteractions.push({
          id: registration._id.toString(),
          type: "event_registration",
          hospitalName: registration.event.createdBy.hospitalName || "Hospital",
          interactionDate: registration.registrationDate,
          bloodType: "N/A",
          units: 0,
          status: registration.status.toLowerCase(),
          details: {
            eventTitle: registration.event.title,
            eventDate: registration.event.date,
            eventVenue: registration.event.venue,
          },
        });
      }
    });

    // Sort all interactions by date (newest first)
    hospitalInteractions.sort(
      (a, b) => new Date(b.interactionDate) - new Date(a.interactionDate)
    );

    return res.status(200).json({
      message: "Hospital history retrieved successfully",
      success: true,
      data: hospitalInteractions,
      count: hospitalInteractions.length,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

// Get user's interaction history with organizations
export const getOrganizationHistory = async (req, res) => {
  try {
    const userId = req.user._id; // From isAuthenticated middleware

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    // Get all interactions with organizations
    const organizationInteractions = []; // 1. Get responses to organization blood requests
    const responsesByUser = await BloodRequestResponse.find({
      donor: userId,
    })
      .populate({
        path: "bloodRequest",
        populate: {
          path: "createdBy",
          select: "role organizationName name",
        },
      })
      .sort({ createdAt: -1 });

    // 2. Get event registrations for organization events
    const eventRegistrations = await EventRegistration.find({ user: userId })
      .populate({
        path: "event",
        populate: {
          path: "createdBy",
          select: "role organizationName name",
        },
      })
      .sort({ createdAt: -1 });

    // Process responses to organization blood requests
    responsesByUser.forEach((response) => {
      if (
        response.bloodRequest &&
        response.bloodRequest.createdBy &&
        response.bloodRequest.createdBy.role === "organization"
      ) {
        organizationInteractions.push({
          id: response._id.toString(),
          type: "blood_response",
          organizationName:
            response.bloodRequest.createdBy.organizationName || "Organization",
          interactionDate: response.createdAt,
          bloodType: response.bloodRequest.bloodType,
          units: response.bloodRequest.unitsRequired,
          status: response.status.toLowerCase(),
          details: {
            patientName: response.bloodRequest.patientName,
            responseMessage: response.message,
            contactNumber: response.contactNumber,
            urgency: response.bloodRequest.urgency,
          },
        });
      }
    });

    // Process organization event registrations
    eventRegistrations.forEach((registration) => {
      if (
        registration.event &&
        registration.event.createdBy &&
        registration.event.createdBy.role === "organization"
      ) {
        organizationInteractions.push({
          id: registration._id.toString(),
          type: "event_registration",
          organizationName:
            registration.event.createdBy.organizationName || "Organization",
          interactionDate: registration.registrationDate,
          bloodType: "N/A",
          units: 0,
          status: registration.status.toLowerCase(),
          details: {
            eventTitle: registration.event.title,
            eventDate: registration.event.date,
            eventVenue: registration.event.venue,
          },
        });
      }
    });

    // Sort all interactions by date (newest first)
    organizationInteractions.sort(
      (a, b) => new Date(b.interactionDate) - new Date(a.interactionDate)
    );

    return res.status(200).json({
      message: "Organization history retrieved successfully",
      success: true,
      data: organizationInteractions,
      count: organizationInteractions.length,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};
