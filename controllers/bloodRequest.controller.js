import BloodRequest from "../models/bloodRequest.model.js";
import User from "../models/user.model.js";
import BloodRequestResponse from "../models/bloodRequestResponse.model.js";
import {
  canUserDonate,
  updateDonationStatus,
} from "../utils/donationStatus.js";

// Create Blood Request
export const createBloodRequest = async (req, res) => {
  try {
    const {
      patientName,
      bloodType,
      hospital,
      hospitalName,
      location,
      urgency,
      unitsRequired,
      unitsNeeded,
      contactNumber,
      reason,
      requiredBy,
    } = req.body;

    // Validate required fields
    if (
      !patientName ||
      !bloodType ||
      !location ||
      !urgency ||
      !(unitsRequired || unitsNeeded) ||
      !contactNumber ||
      !reason
    ) {
      return res.status(400).json({
        message: "All required fields must be provided",
        success: false,
      });
    } // Get user ID from either req.user._id or req.userId
    const userId = req.user?._id || req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "User not authenticated",
        success: false,
      });
    } // Create new blood request
    const newBloodRequest = new BloodRequest({
      patientName,
      bloodType,
      hospital: hospital || hospitalName || "Not specified",
      hospitalName: hospitalName || hospital || "Not specified",
      location,
      urgency,
      unitsRequired: unitsRequired || unitsNeeded || 1,
      unitsNeeded: unitsNeeded || unitsRequired || 1,
      contactNumber,
      reason,
      requiredBy: requiredBy || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days from now
      createdBy: userId,
      requestedBy: userId,
    });

    await newBloodRequest.save();

    res.status(201).json({
      message: "Blood request created successfully",
      bloodRequest: newBloodRequest,
      success: true,
    });
  } catch (error) {
    console.error("Error creating blood request:", error);
    res.status(500).json({
      message: "Server error while creating blood request",
      success: false,
    });
  }
};

// Get All Blood Requests
export const getAllBloodRequests = async (req, res) => {
  try {
    const bloodRequests = await BloodRequest.find({ isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email phone organizationName hospitalName")
      .populate(
        "requestedBy",
        "name email phone organizationName hospitalName"
      );

    // Get all blood request IDs to check for completed responses
    const requestIds = bloodRequests.map((request) => request._id);

    // Find all completed responses for these requests
    const completedResponses = await BloodRequestResponse.find({
      bloodRequest: { $in: requestIds },
      status: "Completed",
    }).select("bloodRequest");

    // Create a Set of request IDs that have completed responses
    const requestsWithCompletedResponses = new Set(
      completedResponses.map((response) => response.bloodRequest.toString())
    );

    // Transform data to match frontend expectations, ensuring deleted requests are excluded
    const transformedRequests = bloodRequests
      .filter((request) => !request.isDeleted)
      .map((request) => ({
        id: request._id.toString(),
        name: request.patientName,
        bloodType: request.bloodType,
        hospital: request.hospitalName || request.hospital || "Not specified",
        location: request.location,
        urgency: request.urgency,
        postedTime: request.createdAt,
        units: request.unitsNeeded || request.unitsRequired || 0,
        contactNumber: request.contactNumber,
        reason: request.reason,
        createdBy: request.createdBy?._id?.toString(),
        status: request.status,
        requiredBy: request.requiredBy,
        isDeleted: request.isDeleted || false,
        hasCompletedResponse: requestsWithCompletedResponses.has(
          request._id.toString()
        ),
      }));

    res.status(200).json({
      message: "Blood requests retrieved successfully",
      bloodRequests: transformedRequests,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching blood requests:", error);
    res.status(500).json({
      message: "Server error while fetching blood requests",
      success: false,
    });
  }
};

// Get Blood Requests by User
export const getUserBloodRequests = async (req, res) => {
  try {
    // Only allow non-user roles to access this endpoint
    if (req.user.role === "user") {
      return res.status(403).json({
        message: "Access denied: Users cannot create blood requests",
        success: false,
      });
    }

    const bloodRequests = await BloodRequest.find({
      createdBy: req.user._id,
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email phone organizationName hospitalName")
      .populate(
        "requestedBy",
        "name email phone organizationName hospitalName"
      );

    // Transform data to match frontend expectations
    const transformedRequests = bloodRequests.map((request) => ({
      id: request._id.toString(),
      name: request.patientName,
      patientName: request.patientName, // Add this for consistency
      bloodType: request.bloodType,
      hospital: request.hospitalName || request.hospital || "Not specified",
      location: request.location,
      urgency: request.urgency,
      postedTime: request.createdAt,
      units: request.unitsNeeded || request.unitsRequired || 0,
      contactNumber: request.contactNumber,
      reason: request.reason,
      createdBy: request.createdBy?._id?.toString(),
      status: request.status,
      requiredBy: request.requiredBy,
      isDeleted: request.isDeleted || false,
    }));

    res.status(200).json({
      message: "User blood requests retrieved successfully",
      bloodRequests: transformedRequests,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching user blood requests:", error);
    res.status(500).json({
      message: "Server error while fetching user blood requests",
      success: false,
    });
  }
};

// Get deleted blood requests by user
export const getUserDeletedBloodRequests = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "User not authenticated",
        success: false,
      });
    }
    const deletedBloodRequests = await BloodRequest.find({
      createdBy: userId,
      isDeleted: true,
    })
      .sort({ updatedAt: -1 })
      .populate("createdBy", "name email phone organizationName hospitalName")
      .populate(
        "requestedBy",
        "name email phone organizationName hospitalName"
      );

    // Transform data to match frontend expectations
    const transformedRequests = deletedBloodRequests.map((request) => ({
      id: request._id.toString(),
      name: request.patientName,
      bloodType: request.bloodType,
      hospital: request.hospitalName || request.hospital || "Not specified",
      location: request.location,
      urgency: request.urgency,
      postedTime: request.createdAt,
      units: request.unitsNeeded || request.unitsRequired || 0,
      contactNumber: request.contactNumber,
      reason: request.reason,
      createdBy: request.createdBy?._id?.toString(),
      status: request.status,
      requiredBy: request.requiredBy,
      isDeleted: request.isDeleted || false,
    }));

    res.status(200).json({
      message: "Deleted blood requests retrieved successfully",
      bloodRequests: transformedRequests,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching deleted blood requests:", error);
    res.status(500).json({
      message: "Server error while fetching deleted blood requests",
      success: false,
    });
  }
};

// Update Blood Request Status (Admin/Hospital)
export const updateBloodRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    // Validate requestId
    if (!requestId || requestId === "undefined" || requestId === "null") {
      return res.status(400).json({
        message: "Invalid or missing request ID",
        success: false,
      });
    }

    // Validate if requestId is a valid ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(requestId)) {
      return res.status(400).json({
        message: "Invalid request ID format",
        success: false,
      });
    }

    if (!["Pending", "Approved", "Rejected", "Fulfilled"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status value",
        success: false,
      });
    }

    // Check if request exists and is not deleted
    const bloodRequest = await BloodRequest.findOne({
      _id: requestId,
      isDeleted: { $ne: true },
    });

    if (!bloodRequest) {
      return res.status(404).json({
        message: "Blood request not found or has been deleted",
        success: false,
      });
    }

    // Update the request
    bloodRequest.status = status;
    bloodRequest.updatedAt = Date.now();
    await bloodRequest.save();

    res.status(200).json({
      message: "Blood request status updated successfully",
      bloodRequest,
      success: true,
    });
  } catch (error) {
    console.error("Error updating blood request status:", error);
    res.status(500).json({
      message: "Server error while updating blood request status",
      success: false,
    });
  }
};

// Respond to Blood Request
export const respondToBloodRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { message, contactNumber } = req.body;

    // Validate requestId
    if (!requestId || requestId === "undefined" || requestId === "null") {
      return res.status(400).json({
        message: "Invalid or missing request ID",
        success: false,
      });
    }

    // Validate if requestId is a valid ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(requestId)) {
      return res.status(400).json({
        message: "Invalid request ID format",
        success: false,
      });
    }

    // Get user ID from authenticated user
    const donorId = req.user?._id || req.userId;

    if (!donorId) {
      return res.status(401).json({
        message: "User not authenticated",
        success: false,
      });
    }

    // Check if user can donate based on their donation status
    const donationCheck = await canUserDonate(donorId);
    if (!donationCheck.canDonate) {
      return res.status(400).json({
        message: `Cannot respond to blood request: ${donationCheck.reason}`,
        success: false,
        nextEligibleDate: donationCheck.nextEligibleDate || null,
      });
    }

    // Validate required fields
    if (!contactNumber) {
      return res.status(400).json({
        message: "Contact number is required",
        success: false,
      });
    } // Check if blood request exists and is not deleted
    const bloodRequest = await BloodRequest.findById(requestId);
    if (!bloodRequest || bloodRequest.isDeleted) {
      return res.status(404).json({
        message: "Blood request not found or has been deleted",
        success: false,
      });
    }

    // Check if user has already responded to this request
    const existingResponse = await BloodRequestResponse.findOne({
      bloodRequest: requestId,
      donor: donorId,
    });

    if (existingResponse) {
      return res.status(400).json({
        message: "You have already responded to this request",
        success: false,
      });
    }

    // Create new response
    const newResponse = new BloodRequestResponse({
      bloodRequest: requestId,
      donor: donorId,
      message:
        message ||
        "I'm available to help with this blood request. Please contact me for further details.",
      contactNumber,
    });

    await newResponse.save();

    // Populate the response with user details
    await newResponse.populate("donor", "name email phone");
    await newResponse.populate(
      "bloodRequest",
      "patientName bloodType hospital"
    );

    res.status(201).json({
      message: "Response sent successfully",
      response: newResponse,
      success: true,
    });
  } catch (error) {
    console.error("Error responding to blood request:", error);
    res.status(500).json({
      message: "Server error while responding to blood request",
      success: false,
    });
  }
};

// Get responses for a blood request
export const getBloodRequestResponses = async (req, res) => {
  try {
    const { requestId } = req.params;

    // Validate requestId
    if (!requestId || requestId === "undefined" || requestId === "null") {
      return res.status(400).json({
        message: "Invalid or missing request ID",
        success: false,
      });
    }

    // Validate if requestId is a valid ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(requestId)) {
      return res.status(400).json({
        message: "Invalid request ID format",
        success: false,
      });
    }

    // Check if the blood request exists and is not deleted
    const bloodRequest = await BloodRequest.findOne({
      _id: requestId,
      isDeleted: { $ne: true },
    });

    if (!bloodRequest) {
      return res.status(404).json({
        message: "Blood request not found or has been deleted",
        success: false,
      });
    }

    const responses = await BloodRequestResponse.find({
      bloodRequest: requestId,
    })
      .populate("donor", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Responses retrieved successfully",
      responses,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching responses:", error);
    res.status(500).json({
      message: "Server error while fetching responses",
      success: false,
    });
  }
};

// Get all responses made by current donor user
export const getUserResponses = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "User not authenticated",
        success: false,
      });
    }

    // First find all non-deleted blood requests
    const validBloodRequests = await BloodRequest.find({
      isDeleted: { $ne: true },
    }).select("_id");
    const validRequestIds = validBloodRequests.map((req) => req._id);

    // Then find responses that match these valid request IDs
    const responses = await BloodRequestResponse.find({
      donor: userId,
      bloodRequest: { $in: validRequestIds },
    })
      .populate({
        path: "bloodRequest",
        select:
          "patientName bloodType hospital location urgency unitsRequired status isDeleted",
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "User responses retrieved successfully",
      responses,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching user responses:", error);
    res.status(500).json({
      message: "Server error while fetching user responses",
      success: false,
    });
  }
};

// Update response status (for request creators - hospital, organization, admin)
export const updateResponseStatus = async (req, res) => {
  try {
    const { responseId } = req.params;
    const { status } = req.body;

    // Validate responseId
    if (!responseId || responseId === "undefined" || responseId === "null") {
      return res.status(400).json({
        message: "Invalid or missing response ID",
        success: false,
      });
    }

    // Validate if responseId is a valid ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(responseId)) {
      return res.status(400).json({
        message: "Invalid response ID format",
        success: false,
      });
    }

    // Validate status
    if (!["Pending", "Accepted", "Declined", "Completed"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status value",
        success: false,
      });
    }

    // Get user ID from authenticated user
    const userId = req.user?._id || req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "User not authenticated",
        success: false,
      });
    }

    // Find the response
    const response = await BloodRequestResponse.findById(responseId);

    if (!response) {
      return res.status(404).json({
        message: "Response not found",
        success: false,
      });
    } // Get the blood request to check if current user is the creator
    const bloodRequest = await BloodRequest.findById(response.bloodRequest);

    if (!bloodRequest || bloodRequest.isDeleted) {
      return res.status(404).json({
        message: "Blood request not found or has been deleted",
        success: false,
      });
    }

    // Check if the current user is the creator of the blood request
    if (bloodRequest.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "You are not authorized to update this response status",
        success: false,
      });
    } // Update the response status
    response.status = status;
    await response.save();

    // If status is being changed to "Completed", update donor's donation status
    if (status === "Completed") {
      try {
        await updateDonationStatus(response.donor);
        console.log(
          `Updated donation status for donor ${response.donor} after blood request completion`
        );
      } catch (donationError) {
        console.error("Error updating donation status:", donationError);
        // Continue with the response even if donation status update fails
      }
    }

    // Return the updated response
    await response.populate("donor", "name email phone");
    await response.populate("bloodRequest", "patientName bloodType hospital");
    res.status(200).json({
      message: "Response status updated successfully",
      response,
      success: true,
    });
  } catch (error) {
    console.error("Error updating response status:", error);
    res.status(500).json({
      message: "Server error while updating response status",
      success: false,
    });
  }
};

// Delete Blood Request (only for request creators)
export const deleteBloodRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    // Validate requestId
    if (!requestId || requestId === "undefined" || requestId === "null") {
      return res.status(400).json({
        message: "Invalid or missing request ID",
        success: false,
      });
    }

    // Validate if requestId is a valid ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(requestId)) {
      return res.status(400).json({
        message: "Invalid request ID format",
        success: false,
      });
    }

    const userId = req.user?._id || req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "User not authenticated",
        success: false,
      });
    }

    // Find the blood request
    const bloodRequest = await BloodRequest.findById(requestId);

    if (!bloodRequest) {
      return res.status(404).json({
        message: "Blood request not found",
        success: false,
      });
    }

    // Check if the current user is the creator of the blood request
    if (bloodRequest.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "You are not authorized to delete this blood request",
        success: false,
      });
    }

    // Soft delete the request by setting isDeleted to true
    bloodRequest.isDeleted = true;
    bloodRequest.updatedAt = Date.now();
    await bloodRequest.save();

    res.status(200).json({
      message: "Blood request deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting blood request:", error);
    res.status(500).json({
      message: "Server error while deleting blood request",
      success: false,
    });
  }
};
