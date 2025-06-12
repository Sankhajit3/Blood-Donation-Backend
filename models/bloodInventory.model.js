import mongoose from "mongoose";

const bloodInventorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    aPositive: {
      type: Number,
      default: 0,
    },
    aNegative: {
      type: Number,
      default: 0,
    },
    bPositive: {
      type: Number,
      default: 0,
    },
    bNegative: {
      type: Number,
      default: 0,
    },
    abPositive: {
      type: Number,
      default: 0,
    },
    abNegative: {
      type: Number,
      default: 0,
    },
    oPositive: {
      type: Number,
      default: 0,
    },
    oNegative: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const BloodInventory = mongoose.model("BloodInventory", bloodInventorySchema);
export default BloodInventory;
