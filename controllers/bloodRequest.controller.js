import BloodRequest from "../models/bloodRequest.model.js";
import User from "../models/user.model.js";

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
      createdBy: req.user._id, // From authenticated user
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