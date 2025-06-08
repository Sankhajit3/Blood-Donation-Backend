import express from "express";
import {
  registerDonor,
  getAllDonors,
  getDonorById,
  getMyDonorForm,
} from "../controllers/donor.controller.js";
import { singleUpload } from "../middlewares/multer.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

// All routes require authentication
router.post("/register", isAuthenticated, singleUpload, registerDonor);
router.get("/all", isAuthenticated, getAllDonors); // admin
router.get("/me", isAuthenticated, getMyDonorForm);
router.get("/:id", isAuthenticated, getDonorById);

export default router;
