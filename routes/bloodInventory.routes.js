import express from "express";
import {
  updateBloodInventory,
  getBloodInventory,
  getAllBloodInventories,
  getInventoryByUserId,
} from "../controllers/bloodInventory.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

// All routes require authentication
router.post("/update", isAuthenticated, updateBloodInventory);
router.get("/", isAuthenticated, getBloodInventory);
router.get("/all", isAuthenticated, getAllBloodInventories);
router.get("/user/:userId", isAuthenticated, getInventoryByUserId);

export default router;
