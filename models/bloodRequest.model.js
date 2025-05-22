import mongoose from "mongoose";

const bloodRequestSchema = new mongoose.Schema({
  patientName: {
    type: String,
    required: [true, "Patient/Recipient name is required"],
  },
  bloodType: {
    type: String,
    required: [true, "Blood type is required"],
    enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  },
  hospital: {
    type: String,
    required: [true, "Hospital name is required"],
  },
  location: {
    type: String,
    required: [true, "Location is required"],
  },
  urgency: {
    type: String,
    required: [true, "Urgency level is required"],
    enum: ["Low", "Medium", "High"],
    default: "Medium",
  },
  unitsRequired: {
    type: Number,
    required: [true, "Units required is needed"],
    min: [1, "At least 1 unit is required"],
  },
  contactNumber: {
    type: String,
    required: [true, "Contact number is required"],
  },
  reason: {
    type: String,
    required: [true, "Reason for request is required"],
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected", "Fulfilled"],
    default: "Pending",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const BloodRequest = mongoose.model("BloodRequest", bloodRequestSchema);
export default BloodRequest;