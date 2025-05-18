// controllers/donor.controller.js
import Donor from "../models/Donor.js";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "../utils/Cloudinary.js";

export const registerDonor = async (req, res) => {
  try {
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
      return res.status(400).json({ message: "You must accept the declaration", success: false });
    }

    const file = req.files?.idProofImage?.[0];
    let idProofImageUrl = "";

    if (file) {
      const fileUri = getDataUri(file);
      const upload = await cloudinary.uploader.upload(fileUri.content);
      idProofImageUrl = upload.secure_url;
    }

    const donor = new Donor({
      name,
      dob,
      gender,
      phone,
      email,
      bloodType,
      idProofType,
      idProofImage: idProofImageUrl,
      disability: disability === "Yes",
      weight,
      hemoglobinCount,
      isHealthy: isHealthy === "Yes",
      declarationAccepted: declarationAccepted === "true" || declarationAccepted === true,
    });

    await donor.save();

    res.status(201).json({ message: "Donor registered successfully", donor, success: true });
  } catch (error) {
    console.error("Error registering donor:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};
