import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "../utils/Cloudinary.js";
import { checkAndUpdateEligibility } from "../utils/donationStatus.js";

// // Secret Key for JWT (store it in .env file in production)
// const JWT_SECRET = process.env.SECRET_KEY ;

// Helper functions to parse measurements
const parseWeight = (weight) => {
  if (typeof weight === "number") return weight;
  if (typeof weight === "string") {
    // Extract numeric value, assuming it's in kg
    const numericValue = parseFloat(weight.replace(/[^\d.-]/g, ""));
    return !isNaN(numericValue) ? numericValue : null;
  }
  return null;
};

const parseHeight = (height) => {
  if (typeof height === "number") return height;
  if (typeof height === "string") {
    // Extract numeric value, assuming it's in cm
    const numericValue = parseFloat(height.replace(/[^\d.-]/g, ""));
    return !isNaN(numericValue) ? numericValue : null;
  }
  return null;
};

// Register User
export const register = async (req, res) => {
  try {
    const {
      role,
      name,
      organizationName,
      organizationId,
      hospitalName,
      hospitalId,
      email,
      password,
      confirmPassword,
      addhar,
      phone,
      // Personal Information
      dateOfBirth,
      address,
      emergencyContact,
      bloodType,
      gender,
      // Medical Details
      weight,
      height,
      bloodPressure,
      chronicConditions,
      allergies,
      medications,
    } = req.body;

    // Basic field validation
    if (!role || !email || !password || !confirmPassword || !phone) {
      return res.status(400).json({
        message: "Please provide all required fields.",
        success: false,
      });
    }

    // Role-based validation (now accepts URLs or files)
    if (role === "admin" && !name) {
      return res
        .status(400)
        .json({ message: "Admin name is required.", success: false });
    }
    if (
      role === "organization" &&
      (!organizationName ||
        (!req.files?.organizationIdImage && !req.body.organizationIdImage))
    ) {
      return res.status(400).json({
        message: "organization name and ID image (file or URL) are required.",
        success: false,
      });
    }
    if (
      role === "hospital" &&
      (!hospitalName ||
        (!req.files?.hospitalIdImage && !req.body.hospitalIdImage))
    ) {
      return res.status(400).json({
        message: "Hospital name and ID image (file or URL) are required.",
        success: false,
      });
    }
    if (
      role === "user" &&
      (!name || !addhar || (!req.files?.addharImage && !req.body.addharImage))
    ) {
      return res.status(400).json({
        message:
          "User name, Aadhaar, and Aadhaar image (file or URL) are required.",
        success: false,
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists with this email.",
        success: false,
      });
    }

    // Check password match
    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "Passwords do not match.", success: false });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // File upload helper (only runs for actual files)
    const uploadFile = async (file) => {
      if (!file) return "";
      const fileUri = getDataUri(file);
      const result = await cloudinary.uploader.upload(fileUri.content);
      return result.secure_url;
    };

    // Handle images (file upload or URL)
    const addharImage = req.files?.addharImage
      ? await uploadFile(req.files.addharImage[0])
      : req.body.addharImage || "";

    const organizationIdImage = req.files?.organizationIdImage
      ? await uploadFile(req.files.organizationIdImage[0])
      : req.body.organizationIdImage || "";

    const hospitalIdImage = req.files?.hospitalIdImage
      ? await uploadFile(req.files.hospitalIdImage[0])
      : req.body.hospitalIdImage || "";

    const profilePhoto = req.files?.profilePhoto
      ? await uploadFile(req.files.profilePhoto[0])
      : req.body.profilePhoto || "";

    // Create new user document
    const newUser = new User({
      role,
      name,
      organizationName,
      organizationId: role === "organization" ? organizationId : null,
      hospitalName,
      hospitalId: role === "hospital" ? hospitalId : null,
      email,
      password: hashedPassword,
      addhar,
      phone,
      addharImage,
      organizationIdImage,
      hospitalIdImage,
      // Personal Information
      dateOfBirth: dateOfBirth || null,
      address: address || null,
      emergencyContact: emergencyContact || null,
      bloodType: bloodType || null,
      gender: gender || null,
      // Medical Details
      weight: parseWeight(weight) || null,
      height: parseHeight(height) || null,
      bloodPressure: bloodPressure || null,
      chronicConditions: Array.isArray(chronicConditions)
        ? chronicConditions
        : chronicConditions
        ? [chronicConditions]
        : [],
      allergies: Array.isArray(allergies)
        ? allergies
        : allergies
        ? [allergies]
        : [],
      medications: Array.isArray(medications)
        ? medications
        : medications
        ? [medications]
        : [],
      profile: {
        bio: "",
        skills: [],
        profilePhoto,
      },
    });

    await newUser.save();

    res
      .status(201)
      .json({ message: "Account created successfully.", success: true });
  } catch (error) {
    console.error("Error in register:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

// Login User
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required.", success: false });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid email or password.", success: false });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res
        .status(400)
        .json({ message: "Invalid email or password.", success: false });
    }
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    // Get the appropriate name based on role
    let displayName = "";
    if (user.role === "hospital") {
      displayName = user.hospitalName;
    } else if (user.role === "organization") {
      displayName = user.organizationName;
    } else {
      displayName = user.name;
    }

    return res
      .status(200)
      .cookie("token", token, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true })
      .json({
        message: `Welcome back ${displayName}`,
        user,
        success: true,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

// Logout User
export const logout = async (req, res) => {
  try {
    return res.status(200).cookie("token", "", { maxAge: 0 }).json({
      message: "Logged out successfully.",
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

// Get All Users (Admin Only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    // Check if any users are found
    if (!users || users.length === 0) {
      return res.status(404).json({
        message: "No users found.",
        success: false,
      });
    }

    res
      .status(200)
      .json({ message: "Users retrieved successfully.", users, success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching users.", success: false });
  }
};

// Get User by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user)
      return res
        .status(404)
        .json({ message: "User not found.", success: false });

    // Check and update donation eligibility if needed
    if (user.role === "user") {
      try {
        await checkAndUpdateEligibility(req.params.id);
        // Refetch user data after potential status update
        const updatedUser = await User.findById(req.params.id).select(
          "-password"
        );
        return res.status(200).json({ user: updatedUser, success: true });
      } catch (eligibilityError) {
        console.error("Error checking donation eligibility:", eligibilityError);
        // Continue with original user data if eligibility check fails
      }
    }

    res.status(200).json({ user, success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

// Delete User
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found.", success: false });
    }

    return res
      .status(200)
      .json({ message: "User deleted successfully.", success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

// Generate Captcha
export const generateCaptcha = async (req, res) => {
  try {
    // Generate a random 6-digit captcha
    const captcha = Math.floor(100000 + Math.random() * 900000).toString();

    return res.status(200).json({
      message: "Captcha generated successfully",
      captcha,
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

export const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const authUser = req.user;

    // Check if user has permission to update (must be admin or the user themselves)
    if (authUser.role !== "admin" && authUser._id.toString() !== userId) {
      return res.status(403).json({
        message: "You don't have permission to update this user",
        success: false,
      });
    }

    const {
      name,
      email,
      phone,
      addhar,
      organizationId,
      organizationName,
      hospitalId,
      hospitalName,
      // Personal Information
      dateOfBirth,
      address,
      emergencyContact,
      bloodType,
      gender,
      // Medical Details
      weight,
      height,
      bloodPressure,
      chronicConditions,
      allergies,
      medications,
    } = req.body;

    let user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found.", success: false });
    }

    // Upload new images/documents if provided
    const fileUploads = {};
    if (req.files) {
      for (const [key, files] of Object.entries(req.files)) {
        if (Array.isArray(files) && files.length > 0) {
          const fileUri = getDataUri(files[0]);
          const uploadResult = await cloudinary.uploader.upload(
            fileUri.content
          );
          fileUploads[key] = uploadResult.secure_url;
        }
      }
    }

    // Update user data - explicitly check for null/undefined to allow empty strings
    if (name !== undefined && name !== null) user.name = name;
    if (email !== undefined && email !== null) user.email = email;
    if (phone !== undefined && phone !== null) user.phone = phone;
    if (addhar !== undefined && addhar !== null) user.addhar = addhar;
    if (organizationId !== undefined && organizationId !== null)
      user.organizationId = organizationId;
    if (organizationName !== undefined && organizationName !== null)
      user.organizationName = organizationName;
    if (hospitalId !== undefined && hospitalId !== null)
      user.hospitalId = hospitalId;
    if (hospitalName !== undefined && hospitalName !== null)
      user.hospitalName = hospitalName;

    // Update personal information
    if (dateOfBirth !== undefined && dateOfBirth !== null)
      user.dateOfBirth = dateOfBirth;
    if (address !== undefined && address !== null) user.address = address;
    if (emergencyContact !== undefined && emergencyContact !== null)
      user.emergencyContact = emergencyContact;
    if (bloodType !== undefined && bloodType !== null)
      user.bloodType = bloodType;
    if (gender !== undefined && gender !== null) user.gender = gender;

    // Update medical details
    if (weight !== undefined && weight !== null)
      user.weight = parseWeight(weight);
    if (height !== undefined && height !== null)
      user.height = parseHeight(height);
    if (bloodPressure !== undefined && bloodPressure !== null)
      user.bloodPressure = bloodPressure;

    if (chronicConditions !== undefined && chronicConditions !== null) {
      try {
        // Handle case when chronicConditions comes as a JSON string
        if (
          typeof chronicConditions === "string" &&
          chronicConditions.startsWith("[")
        ) {
          user.chronicConditions = JSON.parse(chronicConditions);
        } else {
          user.chronicConditions = Array.isArray(chronicConditions)
            ? chronicConditions
            : [chronicConditions];
        }
      } catch (err) {
        console.error("Error parsing chronicConditions:", err);
        user.chronicConditions = Array.isArray(chronicConditions)
          ? chronicConditions
          : [chronicConditions];
      }
    }

    if (allergies !== undefined && allergies !== null) {
      try {
        // Handle case when allergies comes as a JSON string
        if (typeof allergies === "string" && allergies.startsWith("[")) {
          user.allergies = JSON.parse(allergies);
        } else {
          user.allergies = Array.isArray(allergies) ? allergies : [allergies];
        }
      } catch (err) {
        console.error("Error parsing allergies:", err);
        user.allergies = Array.isArray(allergies) ? allergies : [allergies];
      }
    }

    if (medications !== undefined && medications !== null) {
      try {
        // Handle case when medications comes as a JSON string
        if (typeof medications === "string" && medications.startsWith("[")) {
          user.medications = JSON.parse(medications);
        } else {
          user.medications = Array.isArray(medications)
            ? medications
            : [medications];
        }
      } catch (err) {
        console.error("Error parsing medications:", err);
        user.medications = Array.isArray(medications)
          ? medications
          : [medications];
      }
    }

    // Update uploaded images
    if (fileUploads.addharImage) user.addharImage = fileUploads.addharImage;
    if (fileUploads.organizationIdImage)
      user.organizationIdImage = fileUploads.organizationIdImage;
    if (fileUploads.hospitalIdImage)
      user.hospitalIdImage = fileUploads.hospitalIdImage;
    if (fileUploads.profilePhoto) {
      if (!user.profile) user.profile = {};
      user.profile.profilePhoto = fileUploads.profilePhoto;
    }

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully.",
      user,
      success: true,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};
