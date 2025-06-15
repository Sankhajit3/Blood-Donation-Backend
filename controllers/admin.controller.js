import User from "../models/user.model.js";
import Event from "../models/event.model.js";
import BloodRequest from "../models/bloodRequest.model.js";
import Post from "../models/post.model.js";
import BloodInventory from "../models/bloodInventory.model.js";
import EventRegistration from "../models/eventRegistration.model.js";

// Dashboard Statistics
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalHospitals = await User.countDocuments({ role: "hospital" });
    const totalOrganizations = await User.countDocuments({
      role: "organization",
    });
    const totalDonors = await User.countDocuments({ role: "user" });
    const totalEvents = await Event.countDocuments();
    const totalBloodRequests = await BloodRequest.countDocuments();
    const totalPosts = await Post.countDocuments();

    // Active requests
    const activeBloodRequests = await BloodRequest.countDocuments({
      status: { $in: ["pending", "urgent"] },
    });

    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    const stats = {
      totalUsers,
      totalHospitals,
      totalOrganizations,
      totalDonors,
      totalEvents,
      totalBloodRequests,
      activeBloodRequests,
      totalPosts,
      recentUsers,
    };

    res.status(200).json({
      message: "Dashboard statistics retrieved successfully",
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

// User Management
export const getAllUsersForAdmin = async (req, res) => {
  try {
    const { role, page = 1, limit = 10, search } = req.query;

    const query = {};
    if (role && role !== "all") {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { organizationName: { $regex: search, $options: "i" } },
        { hospitalName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      message: "Users retrieved successfully",
      success: true,
      data: {
        users,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in getAllUsersForAdmin:", error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    // Validate userId
    if (!userId || userId === "undefined" || userId === "null") {
      return res.status(400).json({
        message: "Invalid or missing user ID",
        success: false,
      });
    }

    // Validate if userId is a valid ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      return res.status(400).json({
        message: "Invalid user ID format",
        success: false,
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "User status updated successfully",
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error in updateUserStatus:", error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const deleteUserByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!userId || userId === "undefined" || userId === "null") {
      return res.status(400).json({
        message: "Invalid or missing user ID",
        success: false,
      });
    }

    // Validate if userId is a valid ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      return res.status(400).json({
        message: "Invalid user ID format",
        success: false,
      });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "User deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error in deleteUserByAdmin:", error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

// Event Management
export const getAllEventsForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;

    const query = {};
    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    const events = await Event.find(query)
      .populate("createdBy", "name organizationName hospitalName email role")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Event.countDocuments(query);

    res.status(200).json({
      message: "Events retrieved successfully",
      success: true,
      data: {
        events,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in getAllEventsForAdmin:", error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const updateEventStatus = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status } = req.body;

    // Validate eventId
    if (!eventId || eventId === "undefined" || eventId === "null") {
      return res.status(400).json({
        message: "Invalid or missing event ID",
        success: false,
      });
    }

    // Validate if eventId is a valid ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(eventId)) {
      return res.status(400).json({
        message: "Invalid event ID format",
        success: false,
      });
    }

    const event = await Event.findByIdAndUpdate(
      eventId,
      { status },
      { new: true }
    ).populate("createdBy", "name organizationName hospitalName email role");

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Event status updated successfully",
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("Error in updateEventStatus:", error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const deleteEventByAdmin = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Validate eventId
    if (!eventId || eventId === "undefined" || eventId === "null") {
      return res.status(400).json({
        message: "Invalid or missing event ID",
        success: false,
      });
    }

    // Validate if eventId is a valid ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(eventId)) {
      return res.status(400).json({
        message: "Invalid event ID format",
        success: false,
      });
    }

    const event = await Event.findByIdAndDelete(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Event deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error in deleteEventByAdmin:", error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

// Blood Request Management
export const getAllBloodRequestsForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, bloodType } = req.query;

    const query = {};
    if (status && status !== "all") {
      query.status = status;
    }

    if (bloodType && bloodType !== "all") {
      query.bloodType = bloodType;
    }

    if (search) {
      query.$or = [
        { patientName: { $regex: search, $options: "i" } },
        { hospitalName: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    const bloodRequests = await BloodRequest.find(query)
      .populate("requestedBy", "name organizationName hospitalName email role")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await BloodRequest.countDocuments(query);

    res.status(200).json({
      message: "Blood requests retrieved successfully",
      success: true,
      data: {
        bloodRequests,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in getAllBloodRequestsForAdmin:", error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const updateBloodRequestStatusByAdmin = async (req, res) => {
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

    const bloodRequest = await BloodRequest.findByIdAndUpdate(
      requestId,
      { status },
      { new: true }
    ).populate("requestedBy", "name organizationName hospitalName email role");

    if (!bloodRequest) {
      return res.status(404).json({
        message: "Blood request not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Blood request status updated successfully",
      success: true,
      data: bloodRequest,
    });
  } catch (error) {
    console.error("Error in updateBloodRequestStatusByAdmin:", error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const deleteBloodRequestByAdmin = async (req, res) => {
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

    const bloodRequest = await BloodRequest.findByIdAndDelete(requestId);

    if (!bloodRequest) {
      return res.status(404).json({
        message: "Blood request not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Blood request deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error in deleteBloodRequestByAdmin:", error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

// Post Management
export const getAllPostsForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    const query = {};
    if (search) {
      query.$or = [{ query: { $regex: search, $options: "i" } }];
    }

    const posts = await Post.find(query)
      .populate("user", "name organizationName hospitalName email role")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments(query);

    res.status(200).json({
      message: "Posts retrieved successfully",
      success: true,
      data: {
        posts,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in getAllPostsForAdmin:", error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const deletePostByAdmin = async (req, res) => {
  try {
    const { postId } = req.params;

    // Validate postId
    if (!postId || postId === "undefined" || postId === "null") {
      return res.status(400).json({
        message: "Invalid or missing post ID",
        success: false,
      });
    }

    // Validate if postId is a valid ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(postId)) {
      return res.status(400).json({
        message: "Invalid post ID format",
        success: false,
      });
    }

    const post = await Post.findByIdAndDelete(postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Post deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error in deletePostByAdmin:", error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};
