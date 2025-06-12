import BloodInventory from "../models/bloodInventory.model.js";
import User from "../models/user.model.js";

// Update or create blood inventory for hospital/organization
export const updateBloodInventory = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        message: "User not authenticated",
        success: false,
      });
    }

    // Check if user is hospital or organization
    const user = await User.findById(userId);
    if (!user || (user.role !== "hospital" && user.role !== "organization")) {
      return res.status(403).json({
        message: "Only hospitals and organizations can update blood inventory",
        success: false,
      });
    }

    const {
      aPositive,
      aNegative,
      bPositive,
      bNegative,
      abPositive,
      abNegative,
      oPositive,
      oNegative,
    } = req.body;

    // Find existing inventory or create new one
    let inventory = await BloodInventory.findOne({ userId });

    if (!inventory) {
      inventory = new BloodInventory({
        userId,
        aPositive: parseInt(aPositive) || 0,
        aNegative: parseInt(aNegative) || 0,
        bPositive: parseInt(bPositive) || 0,
        bNegative: parseInt(bNegative) || 0,
        abPositive: parseInt(abPositive) || 0,
        abNegative: parseInt(abNegative) || 0,
        oPositive: parseInt(oPositive) || 0,
        oNegative: parseInt(oNegative) || 0,
        lastUpdated: new Date(),
      });
    } else {
      // Update existing inventory
      inventory.aPositive = parseInt(aPositive) || inventory.aPositive;
      inventory.aNegative = parseInt(aNegative) || inventory.aNegative;
      inventory.bPositive = parseInt(bPositive) || inventory.bPositive;
      inventory.bNegative = parseInt(bNegative) || inventory.bNegative;
      inventory.abPositive = parseInt(abPositive) || inventory.abPositive;
      inventory.abNegative = parseInt(abNegative) || inventory.abNegative;
      inventory.oPositive = parseInt(oPositive) || inventory.oPositive;
      inventory.oNegative = parseInt(oNegative) || inventory.oNegative;
      inventory.lastUpdated = new Date();
    }

    await inventory.save();

    return res.status(200).json({
      message: "Blood inventory updated successfully",
      inventory,
      success: true,
    });
  } catch (error) {
    console.error("Error updating blood inventory:", error);
    return res.status(500).json({
      message: "Server error while updating blood inventory",
      success: false,
    });
  }
};

// Get blood inventory by user ID
export const getBloodInventory = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        message: "User not authenticated",
        success: false,
      });
    }

    const inventory = await BloodInventory.findOne({ userId });

    if (!inventory) {
      return res.status(200).json({
        inventory: {
          aPositive: 0,
          aNegative: 0,
          bPositive: 0,
          bNegative: 0,
          abPositive: 0,
          abNegative: 0,
          oPositive: 0,
          oNegative: 0,
          lastUpdated: new Date(),
        },
        success: true,
      });
    }

    return res.status(200).json({
      inventory,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching blood inventory:", error);
    return res.status(500).json({
      message: "Server error while fetching blood inventory",
      success: false,
    });
  }
};

// Get all blood inventories (for admin)
export const getAllBloodInventories = async (req, res) => {
  try {
    const inventories = await BloodInventory.find().populate(
      "userId",
      "name hospitalName organizationName role"
    );

    return res.status(200).json({
      inventories,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching all blood inventories:", error);
    return res.status(500).json({
      message: "Server error while fetching blood inventories",
      success: false,
    });
  }
};
