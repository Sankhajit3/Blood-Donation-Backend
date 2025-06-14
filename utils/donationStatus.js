import User from "../models/user.model.js";

// Function to update user's donation status after completing a donation
export const updateDonationStatus = async (userId) => {
  try {
    const currentDate = new Date();
    const nextEligibleDate = new Date(currentDate);
    nextEligibleDate.setDate(nextEligibleDate.getDate() + 60); // Add 60 days

    await User.findByIdAndUpdate(userId, {
      donationStatus: "inactive",
      lastDonationDate: currentDate,
      nextEligibleDate: nextEligibleDate,
    });

    console.log(`Updated donation status for user ${userId}`);
    return true;
  } catch (error) {
    console.error("Error updating donation status:", error);
    throw error;
  }
};

// Function to check and update donation status based on elapsed time
export const checkAndUpdateEligibility = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const currentDate = new Date();

    // If user has nextEligibleDate and current date is past it, make them active
    if (user.nextEligibleDate && currentDate >= user.nextEligibleDate) {
      await User.findByIdAndUpdate(userId, {
        donationStatus: "active",
        nextEligibleDate: null,
      });
      return "active";
    }

    return user.donationStatus;
  } catch (error) {
    console.error("Error checking donation eligibility:", error);
    throw error;
  }
};

// Function to check if user can donate (for validations)
export const canUserDonate = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { canDonate: false, reason: "User not found" };
    }

    const currentDate = new Date();

    // Check if user is currently inactive due to recent donation
    if (user.donationStatus === "inactive" && user.nextEligibleDate) {
      if (currentDate < user.nextEligibleDate) {
        const daysRemaining = Math.ceil(
          (user.nextEligibleDate - currentDate) / (1000 * 60 * 60 * 24)
        );
        return {
          canDonate: false,
          reason: `Cannot donate for ${daysRemaining} more days`,
          nextEligibleDate: user.nextEligibleDate,
        };
      } else {
        // Update status if 60 days have passed
        await checkAndUpdateEligibility(userId);
        return { canDonate: true, reason: "Eligible to donate" };
      }
    }

    return { canDonate: true, reason: "Eligible to donate" };
  } catch (error) {
    console.error("Error checking if user can donate:", error);
    return { canDonate: false, reason: "Error checking eligibility" };
  }
};
