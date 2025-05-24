import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "../utils/Cloudinary.js";

// // Secret Key for JWT (store it in .env file in production)
// const JWT_SECRET = process.env.SECRET_KEY ;

// Register User
export const register = async (req, res) => {
  try {
    const {
      role,
      name,
      organisationName,
      organisationId, 
      hospitalName,
      hospitalId, 
      email,
      password,
      confirmPassword,
      aadhaar,
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
      medications
    } = req.body;

    // Basic field validation
    if (!role || !email || !password || !confirmPassword || !phone) {
      return res.status(400).json({ message: "Please provide all required fields.", success: false });
    }

    // Role-based validation
    if (role === "admin" && !name) {
      return res.status(400).json({ message: "Admin name is required.", success: false });
    }
    if (role === "organisation" && (!organisationName || !req.files?.organisationIdImage)) {
      return res.status(400).json({ message: "Organisation name and ID image are required.", success: false });
    }
    if (role === "hospital" && (!hospitalName || !req.files?.hospitalIdImage)) {
      return res.status(400).json({ message: "Hospital name and ID image are required.", success: false });
    }
    if (role === "user" && (!name || !addhar || !req.files?.addharImage)) {
      return res.status(400).json({ message: "User name, Aadhaar, and Aadhaar image are required.", success: false });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email.", success: false });
    }

    // Check password match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match.", success: false });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // File upload helper
    const uploadFile = async (file) => {
      if (!file) return "";
      const fileUri = getDataUri(file);
      const result = await cloudinary.uploader.upload(fileUri.content);
      return result.secure_url;
    };

    // Upload files if present
    const addharImage = req.files?.addharImage ? await uploadFile(req.files.addharImage[0]) : "";
    const organisationIdImage = req.files?.organisationIdImage ? await uploadFile(req.files.organisationIdImage[0]) : "";
    const hospitalIdImage = req.files?.hospitalIdImage ? await uploadFile(req.files.hospitalIdImage[0]) : "";
    const profilePhoto = req.files?.profilePhoto ? await uploadFile(req.files.profilePhoto[0]) : "";

    // Create new user document
    const newUser = new User({
      role,
      name,
      organisationName,
      organisationId: role === 'organisation' ? organisationId : null,
      hospitalName,
      hospitalId: role === 'hospital' ? hospitalId : null,
      email,
      password: hashedPassword,
      aadhaar,
      phone,
      addharImage,
      organisationIdImage,
      hospitalIdImage,
      // Personal Information
      dateOfBirth: dateOfBirth || null,
      address: address || null,
      emergencyContact: emergencyContact || null,
      bloodType: bloodType || null,
      gender: gender || null,
      // Medical Details
      weight: weight || null,
      height: height || null,
      bloodPressure: bloodPressure || null,
      chronicConditions: Array.isArray(chronicConditions) ? chronicConditions : (chronicConditions ? [chronicConditions] : []),
      allergies: Array.isArray(allergies) ? allergies : (allergies ? [allergies] : []),
      medications: Array.isArray(medications) ? medications : (medications ? [medications] : []),
      profile: {
        bio: "",
        skills: [],
        profilePhoto,
      },
    });

    await newUser.save();

    res.status(201).json({ message: "Account created successfully.", success: true });
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
        return res.status(400).json({ message: "Email and password are required.", success: false });
      }
  
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "Invalid email or password.", success: false });
      }
  
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) {
        return res.status(400).json({ message: "Invalid email or password.", success: false });
      }
  
      const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
  
      return res
        .status(200)
        .cookie("token", token, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true })
        .json({
          message: `Welcome back ${user.name}`,
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
            success: true
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
                success: false
            });
        }

        res.status(200).json({ message: "Users retrieved successfully.", users, success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching users.", success: false });
    }
};

// Get User by ID
export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found.", success: false });

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
            return res.status(404).json({ message: "User not found.", success: false });
        }

        return res.status(200).json({ message: "User deleted successfully.", success: true });
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
        const userId = req.user.id;
        const { 
            name, 
            email, 
            phone, 
            addhar,
            organisationId, 
            organisationName,
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
            medications
        } = req.body;

        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found.", success: false });
        }

        // Upload new images/documents if provided
        const fileUploads = {};
        if (req.files) {
            for (const [key, file] of Object.entries(req.files)) {
                const fileUri = getDataUri(file);
                const uploadResult = await cloudinary.uploader.upload(fileUri.content);
                fileUploads[key] = uploadResult.secure_url;
            }
        }

        // Update user data
        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (addhar) user.addhar = addhar;
        if (organisationId) user.organisationId = organisationId;
        if (organisationName) user.organisationName = organisationName;
        if (hospitalId) user.hospitalId = hospitalId;
        if (hospitalName) user.hospitalName = hospitalName;

        // Update personal information
        if (dateOfBirth) user.dateOfBirth = dateOfBirth;
        if (address) user.address = address;
        if (emergencyContact) user.emergencyContact = emergencyContact;
        if (bloodType) user.bloodType = bloodType;
        if (gender) user.gender = gender;

        // Update medical details
        if (weight) user.weight = weight;
        if (height) user.height = height;
        if (bloodPressure) user.bloodPressure = bloodPressure;
        if (chronicConditions) user.chronicConditions = Array.isArray(chronicConditions) 
            ? chronicConditions 
            : [chronicConditions];
        if (allergies) user.allergies = Array.isArray(allergies) 
            ? allergies 
            : [allergies];
        if (medications) user.medications = Array.isArray(medications) 
            ? medications 
            : [medications];

        // Update uploaded images
        if (fileUploads.addharImage) user.addharImage = fileUploads.addharImage;
        if (fileUploads.organisationIdImage) user.organisationIdImage = fileUploads.organisationIdImage;
        if (fileUploads.hospitalIdImage) user.hospitalIdImage = fileUploads.hospitalIdImage;

        await user.save();

        return res.status(200).json({ 
            message: "Profile updated successfully.", 
            user, 
            success: true 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", success: false });
    }
};

