import BloodRequest from "../models/bloodRequest.model.js";
import User from "../models/user.model.js";
import BloodRequestResponse from "../models/bloodRequestResponse.model.js";

// Create Blood Request
export const createBloodRequest = async (req, res) => {
  try {
    const {
      patientName,
      bloodType,
      hospital,
      location,
      urgency,
      unitsRequired,
      contactNumber,
      reason,
    } = req.body;

    // Validate required fields
    if (
      !patientName ||
      !bloodType ||
      !hospital ||
      !location ||
      !urgency ||
      !unitsRequired ||
      !contactNumber ||
      !reason
    ) {
      return res.status(400).json({
        message: "All fields are required",
        success: false,
      });
    } // Get user ID from either req.user._id or req.userId
    const userId = req.user?._id || req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "User not authenticated",
        success: false,
      });
    }

    // Create new blood request
    const newBloodRequest = new BloodRequest({
      patientName,
      bloodType,
      hospital,
      location,
      urgency,
      unitsRequired,
      contactNumber,
      reason,
      createdBy: userId,
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
    const bloodRequests = await BloodRequest.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email phone");

    res.status(200).json({
      message: "Blood requests retrieved successfully",
      bloodRequests,
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
    const bloodRequests = await BloodRequest.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email phone");

    res.status(200).json({
      message: "User blood requests retrieved successfully",
      bloodRequests,
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

// Update Blood Request Status (Admin/Hospital)
export const updateBloodRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    if (!["Pending", "Approved", "Rejected", "Fulfilled"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status value",
        success: false,
      });
    }

    const updatedRequest = await BloodRequest.findByIdAndUpdate(
      requestId,
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({
        message: "Blood request not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Blood request status updated successfully",
      bloodRequest: updatedRequest,
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

    // Get user ID from authenticated user
    const donorId = req.user?._id || req.userId;

    if (!donorId) {
      return res.status(401).json({
        message: "User not authenticated",
        success: false,
      });
    }

    // Validate required fields
    if (!contactNumber) {
      return res.status(400).json({
        message: "Contact number is required",
        success: false,
      });
    }

    // Check if blood request exists
    const bloodRequest = await BloodRequest.findById(requestId);
    if (!bloodRequest) {
      return res.status(404).json({
        message: "Blood request not found",
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

    const responses = await BloodRequestResponse.find({ donor: userId })
      .populate(
        "bloodRequest",
        "patientName bloodType hospital location urgency unitsRequired status"
      )
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
