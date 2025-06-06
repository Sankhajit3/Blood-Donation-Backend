import mongoose from "mongoose";

const bloodRequestResponseSchema = new mongoose.Schema({
  bloodRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BloodRequest",
    required: true,
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  message: {
    type: String,
    default:
      "I'm available to help with this blood request. Please contact me for further details.",
  },
  contactNumber: {
    type: String,
    required: true,
  },
  responseTime: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["Pending", "Accepted", "Declined", "Completed"],
    default: "Pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const BloodRequestResponse = mongoose.model(
  "BloodRequestResponse",
  bloodRequestResponseSchema
);
export default BloodRequestResponse;
