// Test script to manually set a user's donation status to inactive
// This is for testing purposes only

import User from "./models/user.model.js";
import mongoose from "mongoose";

// Connect to MongoDB (adjust connection string as needed)
const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/blood-donation", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected for test script");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

const setUserInactive = async () => {
  try {
    await connectDB();

    // Find a user (replace with actual user email or ID)
    const userEmail = "test@example.com"; // Replace with your test user email
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      console.log("User not found with email:", userEmail);
      return;
    }

    console.log("Found user:", user.name, user.email);

    // Set donation status to inactive
    const currentDate = new Date();
    const nextEligibleDate = new Date(currentDate);
    nextEligibleDate.setDate(nextEligibleDate.getDate() + 60); // Add 60 days

    user.donationStatus = "inactive";
    user.lastDonationDate = currentDate;
    user.nextEligibleDate = nextEligibleDate;

    await user.save();

    console.log("User donation status updated:");
    console.log("Status:", user.donationStatus);
    console.log("Last donation date:", user.lastDonationDate);
    console.log("Next eligible date:", user.nextEligibleDate);

    mongoose.connection.close();
  } catch (error) {
    console.error("Error updating user:", error);
    mongoose.connection.close();
  }
};

setUserInactive();
