import Donor from "../models/Donor.js";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "../utils/Cloudinary.js";

// Register a donor
export const registerDonor = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      name,
      dob,
      gender,
      phone,
      email,
      bloodType,
      idProofType,
      disability,
      weight,
      hemoglobinCount,
      isHealthy,
      declarationAccepted
    } = req.body;

    if (!declarationAccepted) {
      return res.status(400).json({ message: "Declaration must be accepted", success: false });
    }

    const file = req.files?.idProofImage?.[0];
    let idProofImageUrl = "";

    if (file) {
      const fileUri = getDataUri(file);
      const upload = await cloudinary.uploader.upload(fileUri.content);
      idProofImageUrl = upload.secure_url;
    }

    const donor = new Donor({
      user: userId,
      name,
      dob,
      gender,
      phone,
      email,
      bloodType,
      idProofType,
      idProofImage: idProofImageUrl,
      disability: disability === "Yes" || disability === true,
      weight,
      hemoglobinCount,
      isHealthy: isHealthy === "Yes" || isHealthy === true,
      declarationAccepted: declarationAccepted === "true" || declarationAccepted === true,
    });

    await donor.save();

    res.status(201).json({ message: "Donor registered successfully", donor, success: true });
  } catch (error) {
    console.error("Register donor error:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

// Get all donors (admin use)
export const getAllDonors = async (req, res) => {
  try {
    const donors = await Donor.find().populate("user", "name email");
    res.status(200).json({ donors, success: true });
  } catch (error) {
    res.status(500).json({ message: "Error fetching donors", success: false });
  }
};

// Get donor by ID
export const getDonorById = async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id).populate("user", "name email");

    if (!donor) {
      return res.status(404).json({ message: "Donor not found", success: false });
    }

    res.status(200).json({ donor, success: true });
  } catch (error) {
    res.status(500).json({ message: "Error fetching donor", success: false });
  }
};

// Get donor form submitted by logged-in user
export const getMyDonorForm = async (req, res) => {
  try {
    const donor = await Donor.findOne({ user: req.user.id });

    if (!donor) {
      return res.status(404).json({ message: "No donor form found for this user", success: false });
    }

    res.status(200).json({ donor, success: true });
  } catch (error) {
    res.status(500).json({ message: "Server error", success: false });
  }
};
