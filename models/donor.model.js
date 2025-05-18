// models/Donor.js
import mongoose from "mongoose";

const donorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dob: { type: Date, required: true },
  gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  bloodType: { type: String, required: true },
  idProofType: {
    type: String,
    enum: ["PAN", "Aadhaar", "Vote ID"],
    required: true,
  },
  idProofImage: { type: String }, // Cloudinary URL
  disability: { type: Boolean, required: true },
  weight: { type: Number, required: true },
  hemoglobinCount: { type: Number, required: true },
  isHealthy: { type: Boolean, required: true },
  declarationAccepted: { type: Boolean, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Donor", donorSchema);
