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
  hospitalName: {
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
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  unitsRequired: {
    type: Number,
    required: [true, "Units required is needed"],
    min: [1, "At least 1 unit is required"],
  },
  unitsNeeded: {
    type: Number,
    required: [true, "Units needed is required"],
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
    enum: [
      "pending",
      "approved",
      "rejected",
      "fulfilled",
      "urgent",
      "cancelled",
    ],
    default: "pending",
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  requiredBy: {
    type: Date,
    required: [true, "Required by date is needed"],
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
